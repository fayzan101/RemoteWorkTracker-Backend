import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
export const ENV = {
	NODE_ENV: process.env.NODE_ENV || 'development',
	PORT: process.env.PORT || '3000',
	DATABASE_URL: process.env.DATABASE_URL || '',
	DB_HOST: process.env.DB_HOST || '',
	DB_PORT: process.env.DB_PORT || '',
	DB_NAME: process.env.DB_NAME || '',
	DB_USER: process.env.DB_USER || '',
	DB_PASSWORD: process.env.DB_PASSWORD || '',
	JWT_SECRET: process.env.JWT_SECRET || '',
	JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
	FRONTEND_URL: process.env.FRONTEND_URL || '',
	/** Comma-separated allowed origins, e.g. `https://app.example.com,http://localhost:5173`. Use `*` to reflect any origin (dev only). */
	CORS_ORIGIN: process.env.CORS_ORIGIN || '',
	/** Set to `1` or `true` when the app sits behind a reverse proxy (needed for correct rate-limit IP). */
	TRUST_PROXY: process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true',
	NGROK_AUTHTOKEN: process.env.NGROK_AUTHTOKEN || '',
	BREVO_API_KEY: process.env.BREVO_API_KEY || '',
	AI_SERVER_BASE_URL: process.env.AI_SERVER_BASE_URL || 'http://localhost:8000',
	AI_SERVICE_CLIENT_ID: process.env.AI_SERVICE_CLIENT_ID || '',
	AI_SERVICE_CLIENT_SECRET: process.env.AI_SERVICE_CLIENT_SECRET || '',
	AI_DEFAULT_SCOPES: process.env.AI_DEFAULT_SCOPES || 'analytics:write analytics:read',
	AI_TOKEN_TTL_SAFETY_SECONDS: Number(process.env.AI_TOKEN_TTL_SAFETY_SECONDS || 60),
};
