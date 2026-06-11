/**
 * Web-side shapes aligned with API JSON (mirrors @jobflow/shared types without importing the package).
 */

export type IntegrationTestStatus = "Success" | "Failed" | "Warning";

export type IntegrationStatus =
  | "Connected"
  | "Not Connected"
  | "Needs Attention"
  | "Expired"
  | "Disabled";

export type IntegrationProvider =
  | "Gmail"
  | "Google Drive"
  | "Google Calendar"
  | "Telegram"
  | "Claude"
  | "LinkedIn"
  | "SMTP"
  | "Resend"
  | "Notion Legacy"
  | "Slack";

export interface IntegrationTestResult {
  provider: IntegrationProvider;
  status: IntegrationTestStatus;
  message: string;
  checkedAt: string;
  metadata?: Record<string, unknown>;
}

export interface IntegrationCatalogEntry {
  provider: IntegrationProvider;
  slug: string;
  purpose: string;
  requiredFor: string[];
}

export interface IntegrationListItem extends IntegrationCatalogEntry {
  status: IntegrationStatus;
  connectedEmail?: string;
  accountName?: string;
  lastSyncAt?: string;
  syncStatus?: string;
  errorMessage?: string;
  scopes: string[];
  metadata: Record<string, unknown>;
  lastTest?: IntegrationTestResult;
}

export interface IntegrationHealthSummary {
  connected: number;
  needsAttention: number;
  notConnected: number;
  expired: number;
  disabled: number;
}
