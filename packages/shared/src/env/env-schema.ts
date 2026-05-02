import { z } from "zod";

/** Documentation and optional parsing helpers for environment variables by category. */

export const appEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  PORT: z.coerce.number().optional(),
  APP_URL: z.string().url().optional(),
  API_PUBLIC_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
});

export const databaseEnvSchema = z.object({
  MONGODB_URI: z.string().min(1).optional(),
});

export const authEnvSchema = z.object({
  JWT_SECRET: z.string().optional(),
  ACCESS_TOKEN_EXPIRES_IN: z.string().optional(),
  BCRYPT_SALT_ROUNDS: z.coerce.number().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
});

export const corsEnvSchema = z.object({
  APP_URL: z.string().optional(),
});

export const queueEnvSchema = z.object({
  REDIS_URL: z.string().optional(),
  QUEUE_MODE: z.enum(["memory", "bullmq", "disabled"]).optional(),
  QUEUE_INLINE_EXECUTION: z.enum(["true", "false"]).optional(),
});

export const integrationsEnvSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
});

export const billingEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

export const aiEnvSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

export const encryptionEnvSchema = z.object({
  ENCRYPTION_KEY: z.string().optional(),
});

export const smtpEnvSchema = z.object({
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

export const schedulerEnvSchema = z.object({
  SCHEDULER_ENABLED: z.enum(["true", "false"]).optional(),
  SCHEDULER_TIMEZONE: z.string().optional(),
});

export const webPublicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_DEMO_TENANT_ID: z.string().optional(),
  NEXT_PUBLIC_DEMO_USER_ID: z.string().optional(),
});

export type AppEnv = z.infer<typeof appEnvSchema>;
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
