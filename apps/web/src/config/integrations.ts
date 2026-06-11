// Integration registry — used by the Settings > Integrations page
// and the automation health monitor.

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
    id:              "gmail",
    name:            "Gmail",
    description:     "Read incoming emails and detect job-related replies automatically.",
    icon:            "Mail",
    docsUrl:         "https://developers.google.com/gmail/api",
    requiredEnvKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GMAIL_USER"],
    optional:        false,
  },
  {
    id:              "google-drive",
    name:            "Google Drive",
    description:     "Auto-create job folders and route CV / cover letter files.",
    icon:            "HardDrive",
    docsUrl:         "https://developers.google.com/drive",
    requiredEnvKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_DRIVE_FOLDER_ID"],
    optional:        false,
  },
  {
    id:              "google-calendar",
    name:            "Google Calendar",
    description:     "Sync interview events and deadline alerts with your calendar.",
    icon:            "CalendarDays",
    docsUrl:         "https://developers.google.com/calendar",
    requiredEnvKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_CALENDAR_ID"],
    optional:        true,
  },
  {
    id:              "anthropic",
    name:            "Anthropic (Claude)",
    description:     "AI for job research, CV tailoring, and email drafting (production default).",
    icon:            "Brain",
    docsUrl:         "https://docs.anthropic.com",
    requiredEnvKeys: ["ANTHROPIC_API_KEY"],
    optional:        true,
  },
  {
    id:              "smtp",
    name:            "SMTP Email",
    description:     "Fallback email delivery for digests and reminders.",
    icon:            "Send",
    docsUrl:         "https://nodemailer.com",
    requiredEnvKeys: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
    optional:        true,
  },
];
