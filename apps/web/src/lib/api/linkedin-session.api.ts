import { apiFetch } from "./client";

export interface LinkedInSessionStatus {
  connected: boolean;
  savedAt: string | null;
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
