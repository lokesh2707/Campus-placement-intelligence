import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  WEB_URL: z.string().default('http://localhost:3000'),
  MOBILE_URL: z.string().default('http://localhost:8081'),
  CORS_ORIGIN: z.string().default('*'),
  DATABASE_URL: z.string().default('postgresql://campus_user:campus_password@localhost:5432/campus_placement?schema=public'),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  REDIS_ENABLED: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .default('false'),
  JWT_ACCESS_SECRET: z.string().default('development_jwt_access_secret_key_change_in_production'),
  JWT_REFRESH_SECRET: z.string().default('development_jwt_refresh_secret_key_change_in_production'),
  STORAGE_PROVIDER: z.enum(['local', 'cloud']).default('local'),
  LOCAL_STORAGE_PATH: z.string().default('./uploads'),
  ML_SERVICE_URL: z.string().default('http://localhost:8000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
