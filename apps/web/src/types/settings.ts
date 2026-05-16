import type { IntegrationStatus } from "@/types/integrations";

export type { IntegrationStatus };

export type SettingsSection =
  | "Profile"
  | "Integrations"
  | "Automation Rules"
  | "Notifications"
  | "Data & Storage"
  | "Security"
  | "Billing";

export interface IntegrationSetting {
  id: string;
  name: string;
  purpose: string;
  status: IntegrationStatus;
  connectedAccount?: string;
  lastSync?: string;
  permissionsSummary?: string;
  provider?: string;
  model?: string;
  apiStatus?: string;
  usageThisMonth?: string;
  smtpHost?: string;
  senderEmail?: string;
  databaseName?: string;
  lastImport?: string;
  rootFolder?: string;
  defaultCalendar?: string;
}

export interface ProfileSettings {
  name: string;
  email: string;
  workspaceName: string;
  timezone: string;
  role: string;
  avatarInitials: string;
}

export interface AutomationRules {
  duplicateDetection: {
    matchByCompanyPositionUrl: boolean;
    matchSensitivity: "Strict" | "Balanced" | "Loose";
  };
  followUpReminder: {
    defaultFollowUpDays: number;
    reminderTime: string;
    autoMarkReminderSent: boolean;
  };
  deadlineAlert: {
    warnBeforeDays: number;
    includeOnlyActiveJobs: boolean;
  };
  lifecycleMonitoring: {
    archiveStaleNewJobsAfterDays: number;
    archiveStaleAppliedJobsAfterDays: number;
  };
  dailyDigest: {
    enabled: boolean;
    time: string;
  };
  weeklyReport: {
    enabled: boolean;
    day: string;
    time: string;
  };
}

export interface NotificationPreferences {
  channels: {
    email: boolean;
    dashboard: boolean;
    slack: boolean;
  };
  events: Record<string, boolean>;
}

export interface StorageSettings {
  database: string;
  fileStorage: string;
  pdfExportsFolder: string;
  dataRetention: string;
}

export interface SecuritySettings {
  passwordStatus: string;
  twoFactorStatus: string;
  activeSessions: string;
  apiKeysStatus: string;
  auditLogsStatus: string;
}

export interface BillingSettings {
  currentPlan: string;
  monthlyUsage: string;
  automationRuns: string;
  aiCredits: string;
  storageUsage: string;
}
