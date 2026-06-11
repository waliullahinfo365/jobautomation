export type IntegrationProvider =
  | "gmail"
  | "google-drive"
  | "google-calendar"
  | "claude"
  | "anthropic"
  | "smtp";

export type IntegrationStatus = "connected" | "disconnected" | "error" | "pending";

export interface Integration {
  _id:        string;
  userId:     string;
  provider:   IntegrationProvider;
  status:     IntegrationStatus;
  config:     Record<string, unknown>;
  lastSyncAt?: Date | string;
  errorMessage?: string;
  createdAt:  Date | string;
  updatedAt:  Date | string;
}
