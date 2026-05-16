import { apiFetch } from "./client";

export type ServiceStatus = "healthy" | "warning" | "needs_attention" | "not_configured" | "offline" | "disabled";

export type ServiceCheck = {
  label: string;
  status: ServiceStatus;
  detail?: string;
};

export type SystemStatusResponse = {
  overallHealth: ServiceStatus;
  api: { status: string; environment: string };
  database: { state: string; host?: string; name?: string };
  queue: { mode: string };
  services: Record<string, ServiceCheck>;
  tenantId: string;
  currentUserRole: string;
  integrationHealth: { connected: number; needsAttention: number; notConnected: number; expired: number; disabled: number };
  billing: { planKey: string; displayName: string; billingStatus: string };
  automation: { moduleCount: number };
  failedLogsLast24h: number;
  recentFailedLogs: Array<{
    id: string;
    moduleKey: string;
    moduleName: string;
    message: string;
    error?: string;
    createdAt?: string;
  }>;
};

export function getSystemStatus() {
  return apiFetch<SystemStatusResponse>("/system/status");
}
