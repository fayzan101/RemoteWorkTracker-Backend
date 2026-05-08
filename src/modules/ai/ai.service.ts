import crypto from 'crypto';
import { ENV } from '../../config/env';
import logger from '../../config/logger';
import { mapEmployeeInputToAiPayload, mapReportInputToAiPayload, mapTaskInputToAiPayload } from './ai.mapper';

type AiLoginResponse = {
	data?: {
		access_token?: string;
		expires_in?: number;
	};
};

type CachedToken = {
	token: string;
	expiresAtEpochSec: number;
};

let cachedToken: CachedToken | null = null;

export class AiServiceError extends Error {
	statusCode: number;
	errorCode?: string;
	traceId?: string;
	meta?: unknown;

	constructor(message: string, statusCode = 500, opts?: { errorCode?: string; traceId?: string; meta?: unknown }) {
		super(message);
		this.statusCode = statusCode;
		this.errorCode = opts?.errorCode;
		this.traceId = opts?.traceId;
		this.meta = opts?.meta;
	}
}

function sanitizeBaseUrl(raw: string): string {
	return raw.replace(/\/+$/, '');
}

export function isAiIntegrationConfigured(): boolean {
	return Boolean(
		ENV.AI_SERVER_BASE_URL &&
		ENV.AI_SERVICE_CLIENT_ID &&
		ENV.AI_SERVICE_CLIENT_SECRET
	);
}

function buildIdempotencyKey(parts: Array<string | number>): string {
	const value = parts.join(':');
	return crypto.createHash('sha256').update(value).digest('hex');
}

async function getAiToken(tenantId: string): Promise<string> {
	if (!isAiIntegrationConfigured()) {
		throw new AiServiceError('AI integration is not configured in environment.', 503);
	}
	const now = Math.floor(Date.now() / 1000);
	if (cachedToken && cachedToken.expiresAtEpochSec - ENV.AI_TOKEN_TTL_SAFETY_SECONDS > now) {
		return cachedToken.token;
	}

	if (!ENV.AI_SERVICE_CLIENT_ID || !ENV.AI_SERVICE_CLIENT_SECRET) {
		throw new AiServiceError('AI service credentials are missing in backend environment.', 500);
	}

	const loginResponse = await fetch(`${sanitizeBaseUrl(ENV.AI_SERVER_BASE_URL)}/api/v1/auth/login`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			client_id: ENV.AI_SERVICE_CLIENT_ID,
			client_secret: ENV.AI_SERVICE_CLIENT_SECRET,
			tenant_id: tenantId,
			scopes: ENV.AI_DEFAULT_SCOPES.split(' ').filter(Boolean),
		}),
	});

	const body = (await loginResponse.json()) as AiLoginResponse & Record<string, unknown>;
	if (!loginResponse.ok || !body?.data?.access_token) {
		throw new AiServiceError('Failed to obtain AI service token.', loginResponse.status, {
			errorCode: (body?.error_code as string | undefined) ?? 'AI_AUTH_FAILURE',
			traceId: body?.trace_id as string | undefined,
			meta: body?.meta,
		});
	}

	const expiresIn = Number(body.data.expires_in ?? 3600);
	cachedToken = {
		token: body.data.access_token,
		expiresAtEpochSec: now + expiresIn,
	};
	return body.data.access_token;
}

async function callAiApi<T>({
	tenantId,
	method,
	path,
	payload,
	idempotencyKey,
	requestId,
}: {
	tenantId: string;
	method: 'GET' | 'POST';
	path: string;
	payload?: Record<string, unknown>;
	idempotencyKey?: string;
	requestId: string;
}): Promise<{ data: T; traceId?: string }> {
	const token = await getAiToken(tenantId);
	const headers: Record<string, string> = {
		authorization: `Bearer ${token}`,
		'x-request-id': requestId,
	};
	if (method !== 'GET') headers['content-type'] = 'application/json';
	if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;

	const response = await fetch(`${sanitizeBaseUrl(ENV.AI_SERVER_BASE_URL)}${path}`, {
		method,
		headers,
		body: method === 'GET' ? undefined : JSON.stringify(payload ?? {}),
	});

	const traceId = response.headers.get('x-trace-id') || undefined;
	const body = (await response.json()) as Record<string, any>;
	if (!response.ok) {
		throw new AiServiceError(body?.message || 'AI server request failed', response.status, {
			errorCode: body?.error_code,
			traceId: body?.trace_id || traceId,
			meta: body?.meta,
		});
	}
	return { data: body.data as T, traceId };
}

export async function syncEmployeeData(input: {
	tenantId: string;
	employeeId: string;
	tasksCompleted: number;
	attendanceDays: number;
	idleHours: number;
	workingHours: number;
	taskProgress: number;
	daysLeft: number;
	lateArrivals: number;
	absentDays: number;
	requestId: string;
}) {
	const payload = mapEmployeeInputToAiPayload(input);
	const idempotencyKey = buildIdempotencyKey([
		'employee',
		input.tenantId,
		input.employeeId,
		input.requestId,
	]);
	return callAiApi({
		tenantId: input.tenantId,
		method: 'POST',
		path: '/api/v1/employee/data',
		payload,
		idempotencyKey,
		requestId: input.requestId,
	});
}

export async function syncTaskData(input: {
	tenantId: string;
	employeeId: string;
	taskId: string;
	progressPercent: number;
	daysLeft: number;
	requestId: string;
}) {
	const payload = mapTaskInputToAiPayload(input);
	const idempotencyKey = buildIdempotencyKey(['task', input.tenantId, input.taskId, input.requestId]);
	return callAiApi({
		tenantId: input.tenantId,
		method: 'POST',
		path: '/api/v1/tasks',
		payload,
		idempotencyKey,
		requestId: input.requestId,
	});
}

export async function generateAnalyticsReport(input: {
	tenantId: string;
	employeeId: string;
	tasksCompleted: number;
	attendanceDays: number;
	idleHours: number;
	workingHours: number;
	taskProgress: number;
	daysLeft: number;
	lateArrivals: number;
	absentDays: number;
	history: Array<{ date: string; productivityScore: number; workingHours: number; idleHours: number }>;
	requestId: string;
}) {
	const payload = mapReportInputToAiPayload(input);
	const idempotencyKey = buildIdempotencyKey([
		'report',
		input.tenantId,
		input.employeeId,
		input.history.length,
		input.requestId,
	]);
	const result = await callAiApi<Record<string, unknown>>({
		tenantId: input.tenantId,
		method: 'POST',
		path: '/api/v1/analytics/report',
		payload,
		idempotencyKey,
		requestId: input.requestId,
	});
	logger.info('AI analytics report generated', { tenantId: input.tenantId, employeeId: input.employeeId, traceId: result.traceId });
	return result;
}

export async function fetchWeeklyReports(input: {
	tenantId: string;
	employeeId: string;
	limit: number;
	requestId: string;
}) {
	const query = new URLSearchParams({
		tenant_id: input.tenantId,
		limit: String(input.limit),
	}).toString();
	return callAiApi<Record<string, unknown>>({
		tenantId: input.tenantId,
		method: 'GET',
		path: `/api/v1/reports/weekly/${encodeURIComponent(input.employeeId)}?${query}`,
		requestId: input.requestId,
	});
}
