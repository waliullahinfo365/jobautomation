import type { IntegrationHealthSummary, IntegrationListItem, IntegrationTestResult } from "@jobflow/shared";
import { apiFetch } from "./client";

export function listIntegrations(): Promise<IntegrationListItem[]> {
  return apiFetch<IntegrationListItem[]>("/integrations");
}

export function getIntegrationHealth(): Promise<IntegrationHealthSummary> {
  return apiFetch<IntegrationHealthSummary>("/integrations/health");
}

export function connectIntegration(provider: string, body: Record<string, unknown> = {}): Promise<IntegrationListItem> {
  return apiFetch<IntegrationListItem>(`/integrations/${provider}/connect`, { method: "POST", body });
}

export function disconnectIntegration(provider: string): Promise<IntegrationListItem> {
  return apiFetch<IntegrationListItem>(`/integrations/${provider}/disconnect`, { method: "POST", body: {} });
}

export function testIntegration(provider: string): Promise<IntegrationTestResult> {
  return apiFetch<IntegrationTestResult>(`/integrations/${provider}/test`, { method: "POST", body: {} });
}

export function replyTest(payload: Record<string, unknown>): Promise<unknown> {
  return apiFetch("/integrations/gmail/reply-test", { method: "POST", body: payload });
}

export type GoogleAuthUrlResponse = {
  authorizationUrl: string;
  provider: string;
  oauthEnabled: boolean;
};

export function getGoogleAuthUrl(providerSlug: "gmail" | "google-drive" | "google-calendar"): Promise<GoogleAuthUrlResponse> {
  return apiFetch<GoogleAuthUrlResponse>(`/integrations/google/${providerSlug}/auth-url`);
}
