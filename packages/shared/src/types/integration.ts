import type { IntegrationTestStatus } from "../constants/statuses";

/** Supported third-party connections (matches Mongo enum). */
export type IntegrationProvider =
  | "Gmail"
  | "Google Drive"
  | "Google Calendar"
  | "OpenAI"
  | "Claude"
  | "SMTP"
  | "Notion Legacy"
  | "Slack";

export type IntegrationStatus =
  | "Connected"
  | "Not Connected"
  | "Needs Attention"
  | "Expired"
  | "Disabled";

export type { IntegrationTestStatus };

/** Persisted tenant integration row (API may omit encrypted fields in responses). */
export interface IntegrationConnection {
  id: string;
  tenantId: string;
  createdBy: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  connectedEmail?: string;
  accountName?: string;
  scopes: string[];
  expiresAt?: string;
  lastSyncAt?: string;
  syncStatus?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Payload from UI when connecting / updating a stub integration. */
export interface IntegrationConnectionInput {
  provider: IntegrationProvider;
  connectedEmail?: string;
  accountName?: string;
  config?: Record<string, unknown>;
  scopes?: string[];
}

/** Deterministic stub result from POST .../test */
export interface IntegrationTestResult {
  provider: IntegrationProvider;
  status: IntegrationTestStatus;
  message: string;
  checkedAt: string;
  metadata?: Record<string, unknown>;
}

/** SMTP demo configuration (never return passwords). */
export interface SmtpIntegrationConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
}

/** AI provider demo configuration — responses include apiKeyPreview only. */
export interface AiProviderIntegrationConfig {
  provider: "OpenAI" | "Claude";
  model: string;
  apiKeyPreview?: string;
}

export interface SlackIntegrationConfig {
  workspaceName: string;
  channelName: string;
}

export interface NotionLegacyIntegrationConfig {
  workspaceName: string;
  databaseName: string;
}

/** Static catalog entry merged with DB row for GET /integrations */
export interface IntegrationCatalogEntry {
  provider: IntegrationProvider;
  slug: string;
  purpose: string;
  requiredFor: string[];
}

/** One row returned by GET /integrations */
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

/** GET /integrations/health */
export interface IntegrationHealthSummary {
  connected: number;
  needsAttention: number;
  notConnected: number;
  expired: number;
  disabled: number;
}
