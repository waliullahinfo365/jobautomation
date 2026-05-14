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

/** POST `/integrations/smtp/test` — sends a real test email via tenant SMTP integration (Bearer auth). */
export function testSmtpIntegration(): Promise<IntegrationTestResult> {
  return testIntegration("smtp");
}

export function replyTest(payload: Record<string, unknown>): Promise<unknown> {
  return apiFetch("/integrations/gmail/reply-test", { method: "POST", body: payload });
}

export type GoogleOAuthStartResult = {
  authUrl: string;
  provider: string;
  oauthEnabled: boolean;
  message?: string;
};

export type TelegramIntegrationStatus = {
  configured: boolean;
  botTokenConfigured: boolean;
  chatIdConfigured: boolean;
  status: "connected" | "not_configured" | "needs_attention" | "disabled";
  lastTest?: IntegrationTestResult;
  lastNotificationAt?: string;
  message?: string;
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
  const oauthEnabled = Boolean((raw as { oauthEnabled?: boolean }).oauthEnabled);
  const message = typeof (raw as { message?: unknown }).message === "string" ? (raw as { message: string }).message : undefined;
  if (oauthEnabled && !authUrl) {
    throw new ApiError("Invalid OAuth URL response", 500);
  }
  return {
    authUrl,
    provider: String((raw as { provider?: string }).provider ?? providerSlug),
    oauthEnabled,
    message,
  };
}

export function getTelegramStatus(): Promise<TelegramIntegrationStatus> {
  return apiFetch<TelegramIntegrationStatus>("/integrations/telegram/status");
}

export function testTelegram(): Promise<IntegrationTestResult> {
  return apiFetch<IntegrationTestResult>("/integrations/telegram/test", { method: "POST", body: {} });
}

export type ResendIntegrationStatus = {
  configured: boolean;
  apiKeyConfigured: boolean;
  fromEmailConfigured: boolean;
  status: "connected" | "not_configured" | "needs_attention";
  lastTest?: IntegrationTestResult;
};

export function getResendStatus(): Promise<ResendIntegrationStatus> {
  return apiFetch<ResendIntegrationStatus>("/integrations/resend/status");
}

export function testResend(body?: { to?: string }): Promise<IntegrationTestResult> {
  return apiFetch<IntegrationTestResult>("/integrations/resend/test", {
    method: "POST",
    body: body ?? {},
  });
}
