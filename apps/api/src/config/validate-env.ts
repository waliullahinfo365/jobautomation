/**
 * Production environment validation for the API.
 * Runs when `NODE_ENV=production` or `FORCE_ENV_VALIDATION=true` (CI / dry-run).
 */

function warn(msg: string): void {
  console.warn(`[env] ${msg}`);
}

function fail(msg: string): never {
  throw new Error(`[env] ${msg}`);
}

export function validateApiEnv(): void {
  const run = process.env.NODE_ENV === "production" || process.env.FORCE_ENV_VALIDATION === "true";
  if (!run) return;

  const required = [
    ["PORT", process.env.PORT],
    ["MONGODB_URI", process.env.MONGODB_URI],
    ["JWT_SECRET", process.env.JWT_SECRET],
    ["APP_URL", process.env.APP_URL],
    ["ENCRYPTION_KEY", process.env.ENCRYPTION_KEY],
    ["API_PUBLIC_URL", process.env.API_PUBLIC_URL],
  ] as const;

  for (const [key, val] of required) {
    if (!val || String(val).trim() === "") {
      fail(`Missing required environment variable: ${key}`);
    }
  }

  const optionalWarn = [
    ["REDIS_URL", process.env.REDIS_URL],
    ["GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID],
    ["GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET],
    ["GOOGLE_REDIRECT_URI", process.env.GOOGLE_REDIRECT_URI],
    ["OPENAI_API_KEY", process.env.OPENAI_API_KEY],
    ["ANTHROPIC_API_KEY", process.env.ANTHROPIC_API_KEY],
    ["STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY],
    ["SMTP_HOST", process.env.SMTP_HOST],
    ["SMTP_USER", process.env.SMTP_USER],
  ] as const;

  for (const [key, val] of optionalWarn) {
    if (!val || String(val).trim() === "") {
      warn(`Optional integration not configured: ${key} (feature may be unavailable)`);
    }
  }
}
