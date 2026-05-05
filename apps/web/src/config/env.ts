function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function optionalBooleanEnv(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  return raw === "true";
}

/**
 * Public API base URL for browser `fetch`. Read only from `process.env.NEXT_PUBLIC_API_URL`.
 * In production, missing or blank values throw (no localhost fallback).
 */
function resolveNextPublicApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (trimmed) return trimmed;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing NEXT_PUBLIC_API_URL: set it to your public API origin (e.g. https://jobautomation-production.up.railway.app). Production cannot fall back to localhost."
    );
  }
  return "http://localhost:4000";
}

export const API_URL = resolveNextPublicApiUrl();
export const DEMO_TENANT_ID = optionalEnv("NEXT_PUBLIC_DEMO_TENANT_ID", "demo-tenant-id");
export const DEMO_USER_ID = optionalEnv("NEXT_PUBLIC_DEMO_USER_ID", "demo-user-id");
/** Target inbox for report send-test actions (demo). */
export const DEMO_REPORT_EMAIL = optionalEnv("NEXT_PUBLIC_DEMO_REPORT_EMAIL", "wali.ullah@gmail.com");
export const USE_MOCK_FALLBACK = optionalBooleanEnv("NEXT_PUBLIC_USE_MOCK_FALLBACK", true);

/** localStorage key for API Bearer token (optional; demo headers used when unset). */
export const AUTH_TOKEN_STORAGE_KEY = optionalEnv("NEXT_PUBLIC_AUTH_TOKEN_KEY", "jobflow_access_token");

export const env = {
  app: {
    url: optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    nodeEnv: optionalEnv("NODE_ENV", "development"),
    isDev: optionalEnv("NODE_ENV", "development") === "development",
    isProd: optionalEnv("NODE_ENV", "development") === "production",
  },
  db: {
    mongoUri: () => requireEnv("MONGODB_URI"),
  },
  auth: {
    secret: () => requireEnv("NEXTAUTH_SECRET"),
    nextAuthUrl: optionalEnv("NEXTAUTH_URL", "http://localhost:3000"),
  },
  google: {
    clientId: () => requireEnv("GOOGLE_CLIENT_ID"),
    clientSecret: () => requireEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri: optionalEnv("GOOGLE_REDIRECT_URI"),
    gmailUser: optionalEnv("GMAIL_USER"),
    driveFolderId: optionalEnv("GOOGLE_DRIVE_FOLDER_ID"),
    calendarId: optionalEnv("GOOGLE_CALENDAR_ID", "primary"),
  },
  openai: {
    apiKey: () => requireEnv("OPENAI_API_KEY"),
    model: optionalEnv("OPENAI_MODEL", "gpt-4o"),
  },
  anthropic: {
    apiKey: () => requireEnv("ANTHROPIC_API_KEY"),
    model: optionalEnv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"),
  },
  smtp: {
    host: optionalEnv("SMTP_HOST", "smtp.gmail.com"),
    port: parseInt(optionalEnv("SMTP_PORT", "587"), 10),
    user: optionalEnv("SMTP_USER"),
    pass: optionalEnv("SMTP_PASS"),
  },
  workers: {
    secret: optionalEnv("WORKER_SECRET"),
    enableWorkers: optionalEnv("ENABLE_WORKERS", "false") === "true",
  },
  api: {
    url: API_URL,
    demoTenantId: DEMO_TENANT_ID,
    demoUserId: DEMO_USER_ID,
    useMockFallback: USE_MOCK_FALLBACK,
  },
} as const;
