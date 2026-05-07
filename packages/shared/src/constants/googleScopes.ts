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

const GOOGLE_PROVIDERS: IntegrationProvider[] = ["Gmail", "Google Drive", "Google Calendar"];

export function getGoogleScopesForProvider(provider: IntegrationProvider): string[] {
  if (!GOOGLE_PROVIDERS.includes(provider)) return [];
  const scopes = GOOGLE_OAUTH_SCOPES[provider as keyof typeof GOOGLE_OAUTH_SCOPES];
  return [...scopes];
}

export function scopesGrantAll(granted: string[] | undefined, required: readonly string[]): boolean {
  const g = granted ?? [];
  return required.every((s) => g.includes(s));
}

export function missingGoogleScopes(granted: string[] | undefined, required: readonly string[]): string[] {
  const g = granted ?? [];
  return required.filter((s) => !g.includes(s));
}
