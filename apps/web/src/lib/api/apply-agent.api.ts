import { apiFetch } from "./client";

export type AgentStatus = {
  connected: boolean;
  deviceName?: string;
  lastHeartbeat?: string | null;
  agentVersion?: string | null;
  linkedInConnected?: boolean;
};

export async function createAgentPairingCode(deviceName?: string) {
  return apiFetch<{ code: string; expiresAt: string }>("/integrations/apply-agent/pairing-code", {
    method: "POST",
    body: JSON.stringify({ deviceName }),
  });
}

export async function getAgentStatus() {
  return apiFetch<AgentStatus>("/integrations/apply-agent/status");
}
