// Integration registry — used by Settings health monitor for product integrations.

export interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  docsUrl: string;
  requiredEnvKeys: string[];
  optional: boolean;
}

export const INTEGRATIONS: IntegrationConfig[] = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync interview events and deadline alerts with your calendar.",
    icon: "CalendarDays",
    docsUrl: "https://developers.google.com/calendar",
    requiredEnvKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    optional: true,
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    description: "AI for job research, CV tailoring, and email drafting.",
    icon: "Brain",
    docsUrl: "https://docs.anthropic.com",
    requiredEnvKeys: ["ANTHROPIC_API_KEY"],
    optional: true,
  },
  {
    id: "resend",
    name: "Resend",
    description: "Email delivery for digests and reminders.",
    icon: "Send",
    docsUrl: "https://resend.com/docs",
    requiredEnvKeys: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"],
    optional: true,
  },
];
