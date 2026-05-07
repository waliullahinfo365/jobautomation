import type { IntegrationProvider } from "../types/integration";

/**
 * OAuth scopes requested per Google-backed integration.
 * - Reports & doc generation use Drive API create + Docs API batchUpdate → needs `documents` + `drive.file`.
 * - Gmail send requires `gmail.send`.
 */
export const GOOGLE_OAUTH_SCOPES = {
  Gmail: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send",
  ],
  "Google Drive": [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/documents",
  ],
  "Google Calendar": ["https://www.googleapis.com/auth/calendar.events"],
} as const satisfies Record<string, readonly string[]>;

/** Scopes workers need when creating/editing Google Docs (digests, weekly reports, AI output, CV routing). */
export const GOOGLE_DRIVE_DOCS_WORKER_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/documents",
] as const;

/** Canonical URLs requested at OAuth time (must match worker checks). */
export const GOOGLE_DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const GOOGLE_DOCUMENTS_SCOPE = "https://www.googleapis.com/auth/documents";
/** Full Drive scope (older OAuth grants) satisfies drive.file for Drive API file ops. */
export const GOOGLE_DRIVE_FULL_SCOPE = "https://www.googleapis.com/auth/drive";

const GOOGLE_PROVIDERS: IntegrationProvider[] = ["Gmail", "Google Drive", "Google Calendar"];

export function getGoogleScopesForProvider(provider: IntegrationProvider): string[] {
  if (!GOOGLE_PROVIDERS.includes(provider)) return [];
  const scopes = GOOGLE_OAUTH_SCOPES[provider as keyof typeof GOOGLE_OAUTH_SCOPES];
  return [...scopes];
}

function normalizeScope(s: string): string {
  return s.trim();
}

/** Whether `granted` satisfies `required` (full Drive scope counts as drive.file). */
export function scopeGranted(granted: string[] | undefined, required: string): boolean {
  const g = new Set((granted ?? []).map(normalizeScope));
  const r = normalizeScope(required);
  if (g.has(r)) return true;
  if (r === GOOGLE_DRIVE_FILE_SCOPE && g.has(GOOGLE_DRIVE_FULL_SCOPE)) return true;
  return false;
}

export function scopesGrantAll(granted: string[] | undefined, required: readonly string[]): boolean {
  return required.every((s) => scopeGranted(granted, s));
}

export function missingGoogleScopes(granted: string[] | undefined, required: readonly string[]): string[] {
  return required.filter((s) => !scopeGranted(granted, s));
}
