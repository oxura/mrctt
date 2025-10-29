import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  ALLOW_BEARER_TOKENS: z.coerce.boolean().default(false),
  COOKIE_DOMAIN: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  FRONTEND_URLS: z.string().optional(),
  FRONTEND_ORIGINS: z.string().optional(),
  API_URL: z.string().url().optional(),
  CSP_REPORT_URI: z.string().url().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().default(587),
  EMAIL_SECURE: z.coerce.boolean().default(false),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().optional(),
  EMAIL_FROM_NAME: z.string().default('Экосистема заявок'),
  CAPTCHA_PROVIDER: z.enum(['hcaptcha', 'turnstile']).optional(),
  HCAPTCHA_SECRET: z.string().optional(),
  HCAPTCHA_SITEKEY: z.string().optional(),
  TURNSTILE_SECRET: z.string().optional(),
  TURNSTILE_SITEKEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
export type Env = typeof env;
