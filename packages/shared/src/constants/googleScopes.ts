import type { IntegrationProvider } from "../types/integration";

/** OAuth scopes requested per Google-backed integration (prepare for production). */
export const GOOGLE_OAUTH_SCOPES = {
  Gmail: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
  ],
  "Google Drive": ["https://www.googleapis.com/auth/drive.file"],
  "Google Calendar": ["https://www.googleapis.com/auth/calendar.events"],
} as const satisfies Record<string, readonly string[]>;

const GOOGLE_PROVIDERS: IntegrationProvider[] = ["Gmail", "Google Drive", "Google Calendar"];

export function getGoogleScopesForProvider(provider: IntegrationProvider): string[] {
  if (!GOOGLE_PROVIDERS.includes(provider)) return [];
  const scopes = GOOGLE_OAUTH_SCOPES[provider as keyof typeof GOOGLE_OAUTH_SCOPES];
  return [...scopes];
}
