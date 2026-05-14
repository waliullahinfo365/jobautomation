import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1).optional(),
  JWT_SECRET: z.string().optional(),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().min(4).max(15).default(12),
  APP_URL: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  CORS_ORIGINS: z.string().optional(),
  /** When true (default) and not in production, demo headers / fallback apply when no Bearer token. Set `false` to require JWT in development. */
  ALLOW_DEV_AUTH_HEADERS: z
    .string()
    .optional()
    .default("true")
    .transform((v) => v !== "false"),
  /** Default workspace for local demo when no JWT and no dev headers. */
  DEMO_TENANT_ID: z.string().optional(),
  DEMO_USER_ID: z.string().optional(),
  API_PUBLIC_URL: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  ENCRYPTION_KEY: z.string().optional(),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .optional()
    .default("info"),
  REDIS_URL: z.string().optional(),
  QUEUE_MODE: z.enum(["memory", "bullmq", "disabled"]).optional(),
  /** When true, allows POST /demo/reset in production (default off). */
  DEMO_MODE_ENABLED: z
    .string()
    .optional()
    .default("false")
    .transform((v) => v === "true"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success && process.env.NODE_ENV !== "test") {
  console.warn("Invalid environment configuration", parsed.error.flatten().fieldErrors);
}
const data = parsed.success
  ? parsed.data
  : envSchema.parse({
      NODE_ENV: process.env.NODE_ENV ?? "development",
      PORT: process.env.PORT ?? 4000,
    });

export const env = {
  nodeEnv: data.NODE_ENV,
  port: data.PORT,
  mongoUri: data.MONGODB_URI ?? "",
  jwtSecret: data.JWT_SECRET ?? "",
  accessTokenExpiresIn: data.ACCESS_TOKEN_EXPIRES_IN,
  bcryptSaltRounds: data.BCRYPT_SALT_ROUNDS,
  appUrl: data.APP_URL ?? "http://localhost:3000",
  corsOrigins: data.CORS_ORIGINS ?? "",
  allowDevAuthHeaders: data.ALLOW_DEV_AUTH_HEADERS,
  demoTenantId: data.DEMO_TENANT_ID ?? "demo-tenant-id",
  demoUserId: data.DEMO_USER_ID ?? "demo-user-id",
  apiPublicUrl: data.API_PUBLIC_URL ?? "",
  encryptionKey: data.ENCRYPTION_KEY ?? "",
  logLevel: data.LOG_LEVEL,
  redisUrl: data.REDIS_URL ?? "",
  queueMode: data.QUEUE_MODE,
  demoModeEnabled: data.DEMO_MODE_ENABLED,
};

export function requireJwtSecretInProduction(): void {
  if (env.nodeEnv === "production" && !env.jwtSecret) {
    throw new Error("JWT_SECRET is required in production");
  }
}
