import { apiFetch } from "./client";

export interface LinkedInSessionStatus {
  connected: boolean;
  sessionExpired?: boolean;
  savedAt: string | null;
  /** True when an HTTP(S) proxy URL is stored with this session (same egress for every worker run). */
  proxyPinned?: boolean;
  loginAttemptStatus?: "pending" | "connected" | "failed" | null;
  loginError?: string | null;
}

export interface LinkedInLoginResult {
  operationId: string;
  status: string;
  message: string;
}

export function startLinkedInLogin(email: string, password: string): Promise<LinkedInLoginResult> {
  return apiFetch<LinkedInLoginResult>("/integrations/linkedin/session", {
    method: "POST",
    body: { email, password },
  });
}

export function getLinkedInSessionStatus(): Promise<LinkedInSessionStatus> {
  return apiFetch<LinkedInSessionStatus>("/integrations/linkedin/session");
}

export function deleteLinkedInSession(): Promise<{ disconnected: boolean }> {
  return apiFetch<{ disconnected: boolean }>("/integrations/linkedin/session", { method: "DELETE" });
}

export function importLinkedInCookies(
  cookies: string,
  proxyUrl?: string
): Promise<{ connected: boolean; cookieCount: number; proxyPinned?: boolean }> {
  return apiFetch<{ connected: boolean; cookieCount: number; proxyPinned?: boolean }>(
    "/integrations/linkedin/session/cookies",
    {
      method: "POST",
      body: {
        cookies,
        ...(proxyUrl?.trim() ? { proxyUrl: proxyUrl.trim() } : {}),
      },
    }
  );
}
