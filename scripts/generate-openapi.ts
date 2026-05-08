import fs from 'fs';
import path from 'path';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

type OpenApiSpec = {
	openapi: '3.0.3';
	info: { title: string; version: string; description?: string };
	servers: { url: string }[];
	components: {
		securitySchemes: {
			bearerAuth: { type: 'http'; scheme: 'bearer'; bearerFormat: 'JWT' };
		};
	};
	security: { bearerAuth: [] }[];
	paths: Record<
		string,
		Partial<
			Record<
				HttpMethod,
				{
					tags: string[];
					summary: string;
					security?: { bearerAuth: [] }[];
					parameters?: Array<{
						name: string;
						in: 'path' | 'query' | 'header' | 'cookie';
						required?: boolean;
						schema: { type: string };
					}>;
					requestBody?: {
						required?: boolean;
						content: { 'application/json': { schema: { type: 'object' } } };
					};
					responses: Record<string, { description: string }>;
				}
			>
		>
	>;
};

function walk(dir: string): string[] {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const out: string[] = [];
	for (const e of entries) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) out.push(...walk(p));
		else out.push(p);
	}
	return out;
}

function normalizePath(base: string, route: string) {
	const full = `${base}/${route}`.replace(/\/+/g, '/');
	return full.startsWith('/') ? full : `/${full}`;
}

function extractRouterMounts(appTs: string) {
	// Matches: app.use("/api/v1/users", userRouter);
	const re = /app\.use\(\s*['"`]([^'"`]+)['"`]\s*,\s*([A-Za-z0-9_]+)\s*\)/g;
	const mounts: Array<{ basePath: string; varName: string }> = [];
	let m: RegExpExecArray | null;
	while ((m = re.exec(appTs))) {
		mounts.push({ basePath: m[1], varName: m[2] });
	}
	return mounts;
}

function extractImportMap(appTs: string) {
	// Matches: import userRouter from "./modules/users/user.routes";
	const re = /import\s+([A-Za-z0-9_]+)\s+from\s+['"`]([^'"`]+)['"`]\s*;/g;
	const map = new Map<string, string>();
	let m: RegExpExecArray | null;
	while ((m = re.exec(appTs))) {
		map.set(m[1], m[2]);
	}
	return map;
}

function extractRoutesFromRouterFile(contents: string) {
	// router.get('/path', ...), router.post("/:id", ...)
	const re = /router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g;
	const routes: Array<{ method: HttpMethod; path: string }> = [];
	let m: RegExpExecArray | null;
	while ((m = re.exec(contents))) {
		routes.push({ method: m[1] as HttpMethod, path: m[2] });
	}
	return routes;
}

function inferPathParams(p: string) {
	const params = [...p.matchAll(/:([A-Za-z0-9_]+)/g)].map((m) => m[1]);
	return params.map((name) => ({
		name,
		in: 'path' as const,
		required: true,
		schema: { type: 'string' },
	}));
}

function tagFromBasePath(basePath: string) {
	const parts = basePath.split('/').filter(Boolean);
	const leaf = parts[parts.length - 1] || 'api';
	return leaf;
}

function needsAuth(routerContents: string) {
	// Heuristic: if router.use(authenticateJWT) exists, treat all operations as secured.
	return /router\.use\(\s*authenticateJWT\s*\)/.test(routerContents);
}

function main() {
	const repoRoot = path.resolve(__dirname, '..');
	const appPath = path.join(repoRoot, 'src', 'app.ts');
	const appTs = fs.readFileSync(appPath, 'utf8');

	const mounts = extractRouterMounts(appTs);
	const imports = extractImportMap(appTs);

	const spec: OpenApiSpec = {
		openapi: '3.0.3',
		info: {
			title: 'Backend API',
			version: '1.0.0',
			description:
				'Auto-generated from Express route files. For full schemas, enrich handlers with explicit OpenAPI annotations.',
		},
		servers: [{ url: '/api' }],
		components: {
			securitySchemes: {
				bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
			},
		},
		security: [{ bearerAuth: [] }],
		paths: {},
	};

	for (const { basePath, varName } of mounts) {
		const importPath = imports.get(varName);
		if (!importPath) continue;

		const abs = path.resolve(path.dirname(appPath), importPath) + '.ts';
		if (!fs.existsSync(abs)) continue;

		const routerContents = fs.readFileSync(abs, 'utf8');
		const routes = extractRoutesFromRouterFile(routerContents);
		const tag = tagFromBasePath(basePath);
		const secured = needsAuth(routerContents);

		for (const r of routes) {
			const fullPath = normalizePath(basePath, r.path);
			spec.paths[fullPath] ||= {};

			spec.paths[fullPath][r.method] = {
				tags: [tag],
				summary: `${r.method.toUpperCase()} ${fullPath}`,
				security: secured ? [{ bearerAuth: [] }] : [],
				parameters: inferPathParams(fullPath),
				requestBody:
					r.method === 'post' || r.method === 'put' || r.method === 'patch'
						? {
								required: true,
								content: {
									'application/json': { schema: { type: 'object' } },
								},
							}
						: undefined,
				responses: {
					'200': { description: 'Success' },
					'400': { description: 'Bad Request' },
					'401': { description: 'Unauthorized' },
					'500': { description: 'Server Error' },
				},
			};
		}
	}

	const outDir = path.join(repoRoot, 'public', 'swagger');
	fs.mkdirSync(outDir, { recursive: true });
	fs.writeFileSync(path.join(outDir, 'openapi.json'), JSON.stringify(spec, null, 2), 'utf8');
	console.log(`Generated OpenAPI spec at public/swagger/openapi.json with ${Object.keys(spec.paths).length} paths.`);
}

main();
