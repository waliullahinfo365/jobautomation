import type { Job } from "@/types/job";
import { apiFetch, withQuery } from "./client";

export function listJobs(params?: Record<string, unknown>) {
  return apiFetch<Job[]>(withQuery("/jobs", params as Record<string, string | number | boolean | null | undefined>));
}
export function getJob(id: string) { return apiFetch<Job>(`/jobs/${id}`); }
export function createJob(payload: Record<string, unknown>) { return apiFetch<Job>("/jobs", { method: "POST", body: payload }); }
export function updateJob(id: string, payload: Record<string, unknown>) { return apiFetch<Job>(`/jobs/${id}`, { method: "PATCH", body: payload }); }
export function archiveJob(id: string) { return apiFetch(`/jobs/${id}/archive`, { method: "DELETE" }); }
export function intakeTest(payload: Record<string, unknown>) { return apiFetch("/jobs/intake-test", { method: "POST", body: payload }); }
export function generateResearch(id: string, options?: { execute?: boolean }) { return apiFetch(withQuery(`/jobs/${id}/generate-research`, { execute: options?.execute } as any), { method: "POST" }); }
export function generateDraft(id: string, options?: { execute?: boolean }) { return apiFetch(withQuery(`/jobs/${id}/generate-draft`, { execute: options?.execute } as any), { method: "POST" }); }
export function runAiProcessing(id: string, options?: Record<string, unknown>) { return apiFetch(withQuery(`/jobs/${id}/ai-processing/run`, { execute: options?.execute as boolean } as any), { method: "POST", body: options }); }
export function provisionFolders(id: string, options?: { execute?: boolean }) { return apiFetch(withQuery(`/jobs/${id}/folders/provision`, { execute: options?.execute } as any), { method: "POST" }); }
export function checkDuplicate(id: string) { return apiFetch(`/jobs/${id}/check-duplicate`, { method: "POST" }); }
