import { apiFetch } from "./client";

export type DemoResetSummary = {
  tenantId: string;
  jobs: number;
  applications: number;
  contacts: number;
  interviews: number;
  documents: number;
  reports: number;
  automationLogs: number;
};

export function resetDemoData() {
  return apiFetch<DemoResetSummary>("/demo/reset", { method: "POST", body: {} });
}
