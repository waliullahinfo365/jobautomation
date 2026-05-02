import type { IntegrationProvider } from "@jobflow/shared/types/integration";

/** URL / API slug → persisted `IntegrationConnection.provider` enum value. */
export const SLUG_TO_PROVIDER: Record<string, IntegrationProvider> = {
  gmail: "Gmail",
  "google-drive": "Google Drive",
  "google-calendar": "Google Calendar",
  openai: "OpenAI",
  claude: "Claude",
  smtp: "SMTP",
  "notion-legacy": "Notion Legacy",
  slack: "Slack",
};

export function providerFromSlug(slug: string): IntegrationProvider | null {
  return SLUG_TO_PROVIDER[slug] ?? null;
}

export function slugForProvider(provider: IntegrationProvider): string {
  const entry = Object.entries(SLUG_TO_PROVIDER).find(([, p]) => p === provider);
  return entry?.[0] ?? provider.toLowerCase().replace(/\s+/g, "-");
}

/** Google OAuth–eligible integration slugs. */
export const GOOGLE_OAUTH_SLUGS = ["gmail", "google-drive", "google-calendar"] as const;
export type GoogleOAuthSlug = (typeof GOOGLE_OAUTH_SLUGS)[number];

export function isGoogleOAuthSlug(slug: string): slug is GoogleOAuthSlug {
  return (GOOGLE_OAUTH_SLUGS as readonly string[]).includes(slug);
}
