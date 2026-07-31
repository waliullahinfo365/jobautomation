import { apiFetch } from "./client";

export type UnipileStatus = {
  connected: boolean;
  configured?: boolean;
  status?: string;
  connectedEmail?: string | null;
  accountName?: string | null;
  accountId?: string | null;
  lastSyncAt?: string | null;
};

export function getUnipileStatus() {
  return apiFetch<UnipileStatus>("/integrations/unipile/status");
}

export function createUnipileConnectLink() {
  return apiFetch<{ url: string; expiresInMinutes: number }>("/integrations/unipile/connect", {
    method: "POST",
    body: {},
  });
}

export function disconnectUnipile() {
  return apiFetch<{ disconnected: boolean }>("/integrations/unipile/disconnect", {
    method: "DELETE",
  });
}

export function scanUnipileEmails(input?: { limit?: number; forceAll?: boolean }) {
  return apiFetch<{
    listed: number;
    processed: number;
    skipped: number;
    created: number;
    errors: string[];
  }>("/integrations/unipile/scan", {
    method: "POST",
    body: input ?? {},
  });
}
