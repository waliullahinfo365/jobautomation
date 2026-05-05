import type { IntegrationHealthSummary, IntegrationListItem, IntegrationTestResult } from "@/types/integrations";
import { ApiError, apiFetch, withQuery } from "./client";

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

export type GoogleOAuthStartResult = {
  authUrl: string;
  provider: string;
  oauthEnabled: boolean;
};

export async function getGoogleAuthUrl(
  providerSlug: "gmail" | "google-drive" | "google-calendar"
): Promise<GoogleOAuthStartResult> {
  // Bypass GET dedupe/cache so each click gets a fresh OAuth state from the API.
  const path = withQuery(`/integrations/google/${providerSlug}/auth-url`, { t: Date.now() });
  const raw = await apiFetch<Record<string, unknown>>(path);
  const authUrl = String(
    (raw as { authUrl?: string }).authUrl ??
      (raw as { url?: string }).url ??
      (raw as { authorizationUrl?: string }).authorizationUrl ??
      ""
  ).trim();
  if (!authUrl) {
    throw new ApiError("Invalid OAuth URL response", 500);
  }
  return {
    authUrl,
    provider: String((raw as { provider?: string }).provider ?? providerSlug),
    oauthEnabled: Boolean((raw as { oauthEnabled?: boolean }).oauthEnabled),
  };
}
