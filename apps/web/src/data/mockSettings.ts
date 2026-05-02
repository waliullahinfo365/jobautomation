import type { IntegrationHealthSummary, IntegrationListItem } from "@jobflow/shared";
import type {
  AutomationRules,
  BillingSettings,
  NotificationPreferences,
  ProfileSettings,
  StorageSettings,
  SecuritySettings,
} from "@/types/settings";

/** Fallback list for GET /integrations when API is unavailable (matches backend catalog). */
export const mockIntegrationListItems: IntegrationListItem[] = [
  {
    provider: "Gmail",
    slug: "gmail",
    purpose: "Job alert intake, reply detection, and outbound messaging.",
    requiredFor: ["job-intake", "email-reply-detection", "follow-up-reminder"],
    status: "Connected",
    connectedEmail: "demo.user@gmail.com",
    accountName: "Demo Workspace",
    lastSyncAt: new Date("2026-05-01T11:15:00Z").toISOString(),
    syncStatus: "OK",
    scopes: ["https://www.googleapis.com/auth/gmail.modify"],
    metadata: { stub: true },
  },
  {
    provider: "Google Drive",
    slug: "google-drive",
    purpose: "Job folders, CV routing, document storage, and PDF exports.",
    requiredFor: ["folder-automation", "cv-routing", "pdf-export"],
    status: "Needs Attention",
    connectedEmail: "demo.user@gmail.com",
    lastSyncAt: new Date("2026-05-01T10:58:00Z").toISOString(),
    syncStatus: "Degraded",
    errorMessage: "Demo: token rotation pending.",
    scopes: ["drive.file"],
    metadata: { stub: true },
  },
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
    provider: "OpenAI",
    slug: "openai",
    purpose: "Research, drafts, extraction, and classification.",
    requiredFor: ["ai-processing", "research-document"],
    status: "Not Connected",
    scopes: [],
    metadata: {},
  },
  {
    provider: "Claude",
    slug: "claude",
    purpose: "Alternative AI generation path.",
    requiredFor: ["ai-processing"],
    status: "Not Connected",
    scopes: [],
    metadata: {},
  },
  {
    provider: "SMTP",
    slug: "smtp",
    purpose: "Fallback delivery for digests, reminders, and reports.",
    requiredFor: ["daily-digest", "weekly-report", "follow-up-reminder"],
    status: "Disabled",
    scopes: [],
    metadata: { stub: true },
  },
  {
    provider: "Notion Legacy",
    slug: "notion-legacy",
    purpose: "One-time import from legacy Notion pipelines.",
    requiredFor: [],
    status: "Not Connected",
    scopes: [],
    metadata: {},
  },
  {
    provider: "Slack",
    slug: "slack",
    purpose: "Workspace notifications (stub).",
    requiredFor: ["lifecycle-monitoring"],
    status: "Not Connected",
    scopes: [],
    metadata: {},
  },
];

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

export const mockProfileSettings: ProfileSettings = {
  name: "Wali Ullah",
  email: "wali.ullah@gmail.com",
  workspaceName: "JobFlow AI",
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
  fileStorage: "Google Drive (placeholder)",
  pdfExportsFolder: "Drive / JobFlow AI / Exports",
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
