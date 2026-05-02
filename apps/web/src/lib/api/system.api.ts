import { apiFetch } from "./client";

export type SystemStatusResponse = {
  api: { status: string; environment: string };
  database: { state: string; host?: string; name?: string };
  queue: { mode: string };
  tenantId: string;
  currentUserRole: string;
  integrationHealth: Record<string, unknown>;
  billing: { planKey: string; displayName: string; billingStatus: string };
  automation: { moduleCount: number };
  recentFailedLogs: Array<{
    id: string;
    moduleKey: string;
    moduleName: string;
    message: string;
    error?: string;
    createdAt?: Date;
  }>;
};

export function getSystemStatus() {
  return apiFetch<SystemStatusResponse>("/system/status");
}
