import { env } from "./env";

function readEnv(key: string): string {
  return process.env[key]?.trim() ?? "";
}

/** Google OAuth client id (optional in local dev). */
export const GOOGLE_CLIENT_ID = readEnv("GOOGLE_CLIENT_ID");
/** Google OAuth client secret (optional in local dev). */
export const GOOGLE_CLIENT_SECRET = readEnv("GOOGLE_CLIENT_SECRET");
/**
 * Registered redirect URI for Google (must match Google Cloud console).
 * Default points at this API’s callback route.
 */
export const GOOGLE_REDIRECT_URI =
  readEnv("GOOGLE_REDIRECT_URI") || `http://localhost:${env.port}/integrations/google/callback`;

/**
 * True when client id, secret, and redirect URI are configured.
 * When false, the app uses demo callback URLs and stub token exchange only.
 */
export const GOOGLE_OAUTH_ENABLED = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REDIRECT_URI);

/** Public base URL for this API (used to build demo-callback links). */
export function getApiPublicBaseUrl(): string {
  const explicit = readEnv("API_PUBLIC_URL");
  if (explicit) return explicit.replace(/\/$/, "");
  return `http://localhost:${env.port}`;
}
