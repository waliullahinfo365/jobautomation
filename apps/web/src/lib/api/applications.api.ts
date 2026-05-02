import type { Application } from "@/types/application";
import { apiFetch, withQuery } from "./client";

export function listApplications(params?: Record<string, unknown>) {
  return apiFetch<Application[]>(withQuery("/applications", params as any));
}
export function getApplication(id: string) { return apiFetch<Application>(`/applications/${id}`); }
export function createApplication(payload: Record<string, unknown>) { return apiFetch<Application>("/applications", { method: "POST", body: payload }); }
export function updateApplication(id: string, payload: Record<string, unknown>) { return apiFetch<Application>(`/applications/${id}`, { method: "PATCH", body: payload }); }
export function markApplied(id: string, payload?: Record<string, unknown>) { return apiFetch(`/applications/${id}/mark-applied`, { method: "POST", body: payload ?? {} }); }
export function scheduleFollowUp(id: string, payload: Record<string, unknown>) { return apiFetch(`/applications/${id}/schedule-follow-up`, { method: "POST", body: payload }); }
export function markFollowUpSent(id: string) { return apiFetch(`/applications/${id}/mark-follow-up-sent`, { method: "POST", body: {} }); }
export function getDueFollowUps() { return apiFetch("/applications/follow-ups/due"); }
export function processDueFollowUps(payload?: Record<string, unknown>) { return apiFetch("/applications/follow-ups/process-due", { method: "POST", body: payload ?? {} }); }
