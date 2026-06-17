import { z } from "zod";
/** Documentation and optional parsing helpers for environment variables by category. */
export declare const appEnvSchema: z.ZodObject<{
    NODE_ENV: z.ZodOptional<z.ZodEnum<["development", "test", "production"]>>;
    PORT: z.ZodOptional<z.ZodNumber>;
    APP_URL: z.ZodOptional<z.ZodString>;
    API_PUBLIC_URL: z.ZodOptional<z.ZodString>;
    LOG_LEVEL: z.ZodOptional<z.ZodEnum<["fatal", "error", "warn", "info", "debug", "trace", "silent"]>>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV?: "test" | "development" | "production" | undefined;
    PORT?: number | undefined;
    APP_URL?: string | undefined;
    API_PUBLIC_URL?: string | undefined;
    LOG_LEVEL?: "debug" | "error" | "info" | "fatal" | "warn" | "trace" | "silent" | undefined;
}, {
    NODE_ENV?: "test" | "development" | "production" | undefined;
    PORT?: number | undefined;
    APP_URL?: string | undefined;
    API_PUBLIC_URL?: string | undefined;
    LOG_LEVEL?: "debug" | "error" | "info" | "fatal" | "warn" | "trace" | "silent" | undefined;
}>;
export declare const databaseEnvSchema: z.ZodObject<{
    MONGODB_URI: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    MONGODB_URI?: string | undefined;
}, {
    MONGODB_URI?: string | undefined;
}>;
export declare const authEnvSchema: z.ZodObject<{
    JWT_SECRET: z.ZodOptional<z.ZodString>;
    ACCESS_TOKEN_EXPIRES_IN: z.ZodOptional<z.ZodString>;
    BCRYPT_SALT_ROUNDS: z.ZodOptional<z.ZodNumber>;
    NEXTAUTH_SECRET: z.ZodOptional<z.ZodString>;
    NEXTAUTH_URL: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    JWT_SECRET?: string | undefined;
    ACCESS_TOKEN_EXPIRES_IN?: string | undefined;
    BCRYPT_SALT_ROUNDS?: number | undefined;
    NEXTAUTH_SECRET?: string | undefined;
    NEXTAUTH_URL?: string | undefined;
}, {
    JWT_SECRET?: string | undefined;
    ACCESS_TOKEN_EXPIRES_IN?: string | undefined;
    BCRYPT_SALT_ROUNDS?: number | undefined;
    NEXTAUTH_SECRET?: string | undefined;
    NEXTAUTH_URL?: string | undefined;
}>;
export declare const corsEnvSchema: z.ZodObject<{
    APP_URL: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    APP_URL?: string | undefined;
}, {
    APP_URL?: string | undefined;
}>;
export declare const queueEnvSchema: z.ZodObject<{
    REDIS_URL: z.ZodOptional<z.ZodString>;
    QUEUE_MODE: z.ZodOptional<z.ZodEnum<["memory", "bullmq", "disabled"]>>;
    QUEUE_INLINE_EXECUTION: z.ZodOptional<z.ZodEnum<["true", "false"]>>;
}, "strip", z.ZodTypeAny, {
    REDIS_URL?: string | undefined;
    QUEUE_MODE?: "memory" | "bullmq" | "disabled" | undefined;
    QUEUE_INLINE_EXECUTION?: "true" | "false" | undefined;
}, {
    REDIS_URL?: string | undefined;
    QUEUE_MODE?: "memory" | "bullmq" | "disabled" | undefined;
    QUEUE_INLINE_EXECUTION?: "true" | "false" | undefined;
}>;
export declare const integrationsEnvSchema: z.ZodObject<{
    GOOGLE_CLIENT_ID: z.ZodOptional<z.ZodString>;
    GOOGLE_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    GOOGLE_REDIRECT_URI: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    GOOGLE_CLIENT_ID?: string | undefined;
    GOOGLE_CLIENT_SECRET?: string | undefined;
    GOOGLE_REDIRECT_URI?: string | undefined;
}, {
    GOOGLE_CLIENT_ID?: string | undefined;
    GOOGLE_CLIENT_SECRET?: string | undefined;
    GOOGLE_REDIRECT_URI?: string | undefined;
}>;
export declare const billingEnvSchema: z.ZodObject<{
    STRIPE_SECRET_KEY: z.ZodOptional<z.ZodString>;
    STRIPE_WEBHOOK_SECRET: z.ZodOptional<z.ZodString>;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string | undefined;
}, {
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string | undefined;
}>;
export declare const aiEnvSchema: z.ZodObject<{
    OPENAI_API_KEY: z.ZodOptional<z.ZodString>;
    ANTHROPIC_API_KEY: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    OPENAI_API_KEY?: string | undefined;
    ANTHROPIC_API_KEY?: string | undefined;
}, {
    OPENAI_API_KEY?: string | undefined;
    ANTHROPIC_API_KEY?: string | undefined;
}>;
export declare const encryptionEnvSchema: z.ZodObject<{
    ENCRYPTION_KEY: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    ENCRYPTION_KEY?: string | undefined;
}, {
    ENCRYPTION_KEY?: string | undefined;
}>;
export declare const smtpEnvSchema: z.ZodObject<{
    SMTP_HOST: z.ZodOptional<z.ZodString>;
    SMTP_PORT: z.ZodOptional<z.ZodNumber>;
    SMTP_USER: z.ZodOptional<z.ZodString>;
    SMTP_PASS: z.ZodOptional<z.ZodString>;
    SMTP_FROM: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    SMTP_HOST?: string | undefined;
    SMTP_PORT?: number | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASS?: string | undefined;
    SMTP_FROM?: string | undefined;
}, {
    SMTP_HOST?: string | undefined;
    SMTP_PORT?: number | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASS?: string | undefined;
    SMTP_FROM?: string | undefined;
}>;
export declare const schedulerEnvSchema: z.ZodObject<{
    SCHEDULER_ENABLED: z.ZodOptional<z.ZodEnum<["true", "false"]>>;
    SCHEDULER_TIMEZONE: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    SCHEDULER_ENABLED?: "true" | "false" | undefined;
    SCHEDULER_TIMEZONE?: string | undefined;
}, {
    SCHEDULER_ENABLED?: "true" | "false" | undefined;
    SCHEDULER_TIMEZONE?: string | undefined;
}>;
export declare const webPublicEnvSchema: z.ZodObject<{
    NEXT_PUBLIC_API_URL: z.ZodOptional<z.ZodString>;
    NEXT_PUBLIC_APP_URL: z.ZodOptional<z.ZodString>;
    NEXT_PUBLIC_DEMO_TENANT_ID: z.ZodOptional<z.ZodString>;
    NEXT_PUBLIC_DEMO_USER_ID: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NEXT_PUBLIC_API_URL?: string | undefined;
    NEXT_PUBLIC_APP_URL?: string | undefined;
    NEXT_PUBLIC_DEMO_TENANT_ID?: string | undefined;
    NEXT_PUBLIC_DEMO_USER_ID?: string | undefined;
}, {
    NEXT_PUBLIC_API_URL?: string | undefined;
    NEXT_PUBLIC_APP_URL?: string | undefined;
    NEXT_PUBLIC_DEMO_TENANT_ID?: string | undefined;
    NEXT_PUBLIC_DEMO_USER_ID?: string | undefined;
}>;
export type AppEnv = z.infer<typeof appEnvSchema>;
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
