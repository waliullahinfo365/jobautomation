"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webPublicEnvSchema = exports.schedulerEnvSchema = exports.smtpEnvSchema = exports.encryptionEnvSchema = exports.aiEnvSchema = exports.billingEnvSchema = exports.integrationsEnvSchema = exports.queueEnvSchema = exports.corsEnvSchema = exports.authEnvSchema = exports.databaseEnvSchema = exports.appEnvSchema = void 0;
const zod_1 = require("zod");
/** Documentation and optional parsing helpers for environment variables by category. */
exports.appEnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).optional(),
    PORT: zod_1.z.coerce.number().optional(),
    APP_URL: zod_1.z.string().url().optional(),
    API_PUBLIC_URL: zod_1.z.string().url().optional(),
    LOG_LEVEL: zod_1.z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
});
exports.databaseEnvSchema = zod_1.z.object({
    MONGODB_URI: zod_1.z.string().min(1).optional(),
});
exports.authEnvSchema = zod_1.z.object({
    JWT_SECRET: zod_1.z.string().optional(),
    ACCESS_TOKEN_EXPIRES_IN: zod_1.z.string().optional(),
    BCRYPT_SALT_ROUNDS: zod_1.z.coerce.number().optional(),
    NEXTAUTH_SECRET: zod_1.z.string().optional(),
    NEXTAUTH_URL: zod_1.z.string().optional(),
});
exports.corsEnvSchema = zod_1.z.object({
    APP_URL: zod_1.z.string().optional(),
});
exports.queueEnvSchema = zod_1.z.object({
    REDIS_URL: zod_1.z.string().optional(),
    QUEUE_MODE: zod_1.z.enum(["memory", "bullmq", "disabled"]).optional(),
    QUEUE_INLINE_EXECUTION: zod_1.z.enum(["true", "false"]).optional(),
});
exports.integrationsEnvSchema = zod_1.z.object({
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    GOOGLE_REDIRECT_URI: zod_1.z.string().optional(),
});
exports.billingEnvSchema = zod_1.z.object({
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: zod_1.z.string().optional(),
});
exports.aiEnvSchema = zod_1.z.object({
    OPENAI_API_KEY: zod_1.z.string().optional(),
    ANTHROPIC_API_KEY: zod_1.z.string().optional(),
});
exports.encryptionEnvSchema = zod_1.z.object({
    ENCRYPTION_KEY: zod_1.z.string().optional(),
});
exports.smtpEnvSchema = zod_1.z.object({
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    SMTP_FROM: zod_1.z.string().optional(),
});
exports.schedulerEnvSchema = zod_1.z.object({
    SCHEDULER_ENABLED: zod_1.z.enum(["true", "false"]).optional(),
    SCHEDULER_TIMEZONE: zod_1.z.string().optional(),
});
exports.webPublicEnvSchema = zod_1.z.object({
    NEXT_PUBLIC_API_URL: zod_1.z.string().optional(),
    NEXT_PUBLIC_APP_URL: zod_1.z.string().optional(),
    NEXT_PUBLIC_DEMO_TENANT_ID: zod_1.z.string().optional(),
    NEXT_PUBLIC_DEMO_USER_ID: zod_1.z.string().optional(),
});
