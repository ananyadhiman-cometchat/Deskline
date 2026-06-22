import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGINS: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  // CometChat (server-side only)
  COMETCHAT_APP_ID: z.string().optional(),
  COMETCHAT_REGION: z.string().optional(),
  COMETCHAT_REST_API_KEY: z.string().optional(),
  COMETCHAT_WEBHOOK_SECRET: z.string().optional(),
  COMETCHAT_AI_AGENT_UID: z.string().optional()
});

const inputEnv =
  process.env.NODE_ENV === 'test'
    ? {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/deskline',
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'test-access-secret',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret'
      }
    : process.env;

const parsedEnv = envSchema.safeParse(inputEnv);

if (!parsedEnv.success) {
  console.error('Invalid environment variables', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsedEnv.data;
