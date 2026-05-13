import type { AutomationLog, AutomationModule } from "@/types/automation";
import { apiFetch, withQuery } from "./client";

export function listAutomationModules() { return apiFetch<AutomationModule[]>("/automation/modules"); }
export function updateAutomationModule(moduleKey: string, payload: Record<string, unknown>) { return apiFetch(`/automation/modules/${moduleKey}`, { method: "PATCH", body: payload }); }
export function runAutomationModule(moduleKey: string, payload?: Record<string, unknown>, options?: { execute?: boolean }) {
  return apiFetch(withQuery(`/automation/modules/${moduleKey}/run`, { execute: options?.execute } as any), { method: "POST", body: payload ?? {} });
}
export function listAutomationLogs(params?: Record<string, unknown>) { return apiFetch<AutomationLog[]>(withQuery("/automation/logs", params as any)); }
export function resetOperationalData(payload: { dryRun: boolean; adminResetToken: string; reason?: string }) {
  return apiFetch("/admin/workspace/reset-operational-data", { method: "POST", body: payload });
}
export function backfillJobIntake(payload: { label: string; days: number; dryRun: boolean; enqueueDownstream: boolean }) {
  return apiFetch("/automation/job-intake/backfill", { method: "POST", body: payload });
}
