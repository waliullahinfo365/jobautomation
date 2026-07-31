import type { IntegrationHealthSummary, IntegrationListItem } from "@/types/integrations";
import type {
  AutomationRules,
  BillingSettings,
  NotificationPreferences,
  ProfileSettings,
  StorageSettings,
  SecuritySettings,
} from "@/types/settings";
import { isIntegrationSlugVisible } from "@/lib/feature-flags";

/** Fallback list for GET /integrations when API is unavailable (product catalog only). */
const ALL_MOCK_INTEGRATION_ITEMS: IntegrationListItem[] = [
  {
    provider: "Google Calendar",
    slug: "google-calendar",
    purpose: "Interview scheduling and calendar reminders.",
    requiredFor: ["interview-scheduling"],
    status: "Connected",
    connectedEmail: "demo.user@gmail.com",
    lastSyncAt: new Date("2026-05-01T10:42:00Z").toISOString(),
    syncStatus: "OK",
    scopes: ["calendar.events"],
    metadata: { stub: true },
  },
  {
    provider: "Telegram",
    slug: "telegram",
    purpose: "Telegram notifications for job alerts, reminders, reports, and automation failures.",
    requiredFor: ["notifications", "daily-digest", "weekly-report", "deadline-alert", "follow-up-reminder"],
    status: "Not Connected",
    scopes: [],
    metadata: { botTokenConfigured: false, chatIdConfigured: false },
  },
  {
    provider: "Claude",
    slug: "claude",
    purpose: "Anthropic Claude for research, drafts, extraction, and classification.",
    requiredFor: ["ai-processing", "research-document"],
    status: "Not Connected",
    scopes: [],
    metadata: {},
  },
  {
    provider: "Resend",
    slug: "resend",
    purpose: "Email API delivery for reports, digests, and reminders.",
    requiredFor: ["daily-digest", "weekly-report", "follow-up-reminder", "deadline-alert"],
    status: "Not Connected",
    scopes: [],
    metadata: { apiKeyConfigured: false, fromEmailConfigured: false },
  },
  {
    provider: "Slack",
    slug: "slack",
    purpose: "Admin/team notifications for automation errors, queue issues, and summaries.",
    requiredFor: ["lifecycle-monitoring"],
    status: "Not Connected",
    scopes: [],
    metadata: {},
  },
];

export const mockIntegrationListItems: IntegrationListItem[] = ALL_MOCK_INTEGRATION_ITEMS.filter((i) =>
  isIntegrationSlugVisible(i.slug)
);

export const mockIntegrationsHealth: IntegrationHealthSummary = mockIntegrationListItems.reduce(
  (acc, i) => {
    switch (i.status) {
      case "Connected":
        acc.connected += 1;
        break;
      case "Needs Attention":
        acc.needsAttention += 1;
        break;
      case "Not Connected":
        acc.notConnected += 1;
        break;
      case "Expired":
        acc.expired += 1;
        break;
      case "Disabled":
        acc.disabled += 1;
        break;
      default:
        acc.notConnected += 1;
    }
    return acc;
  },
  { connected: 0, needsAttention: 0, notConnected: 0, expired: 0, disabled: 0 }
);

/** Fallback for GET /integrations/resend/status when API is offline. */
export const mockResendIntegrationStatus = {
  configured: false,
  apiKeyConfigured: false,
  fromEmailConfigured: false,
  status: "not_configured" as const,
  message: "Resend is not configured.",
  lastTest: undefined,
};

export const mockProfileSettings: ProfileSettings = {
  name: "Wali Ullah",
  email: "wali.ullah@gmail.com",
  workspaceName: "NewJob Guru",
  timezone: "Asia/Karachi (UTC+5)",
  role: "Admin",
  avatarInitials: "WU",
};

export const mockAutomationRules: AutomationRules = {
  duplicateDetection: {
    matchByCompanyPositionUrl: true,
    matchSensitivity: "Balanced",
  },
  followUpReminder: {
    defaultFollowUpDays: 5,
    reminderTime: "09:00",
    autoMarkReminderSent: false,
  },
  deadlineAlert: {
    warnBeforeDays: 2,
    includeOnlyActiveJobs: true,
  },
  lifecycleMonitoring: {
    archiveStaleNewJobsAfterDays: 30,
    archiveStaleAppliedJobsAfterDays: 60,
  },
  dailyDigest: {
    enabled: true,
    time: "08:00",
  },
  weeklyReport: {
    enabled: true,
    day: "Monday",
    time: "09:00",
  },
};

export const mockNotificationPreferences: NotificationPreferences = {
  channels: {
    email: true,
    dashboard: true,
    slack: false,
  },
  events: {
    "New job detected": true,
    "Duplicate skipped": true,
    "Application ready": true,
    "Follow-up due": true,
    "Reply received": true,
    "Interview scheduled": true,
    "Offer detected": true,
    "Deadline approaching": true,
    "Automation failed": true,
    "Daily digest": true,
    "Weekly report": true,
  },
};

export const mockStorageSettings: StorageSettings = {
  database: "MongoDB (placeholder)",
  fileStorage: "Firebase Storage",
  pdfExportsFolder: "App / NewJob Guru / Exports",
  dataRetention: "12 months",
};

export const mockSecuritySettings: SecuritySettings = {
  passwordStatus: "Last updated 42 days ago",
  twoFactorStatus: "Disabled (placeholder)",
  activeSessions: "2 active sessions",
  apiKeysStatus: "No custom API keys generated",
  auditLogsStatus: "Available (placeholder)",
};

export const mockBillingSettings: BillingSettings = {
  currentPlan: "Internal Beta",
  monthlyUsage: "2,480 workflow events",
  automationRuns: "6,612 runs",
  aiCredits: "0 / 10,000",
  storageUsage: "3.8 GB / 20 GB",
};
