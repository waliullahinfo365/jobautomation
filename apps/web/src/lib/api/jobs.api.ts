import type { Job } from "@/types/job";
import { DEMO_TENANT_ID, DEMO_USER_ID } from "@/config/env";
import { apiFetch, withQuery } from "./client";

/** Response from POST queue endpoints (generate-research, generate-draft, etc.). */
export type JobQueueEnqueueResponse = {
  operationId: string;
  jobId: string;
  moduleKey: string;
  status: "queued" | "scheduled" | "skipped";
  message: string;
};

/** Response from POST /jobs/:id/check-duplicate (sync). */
export type JobDuplicateCheckResponse = {
  status: "Unique" | "Possible Duplicate" | "Duplicate" | "Skipped";
  duplicateOfJobId?: string;
  duplicateScore: number;
  reasons: string[];
};

function tenantIdsForJobCreate(): { tenantId: string; createdBy: string } {
  if (typeof window === "undefined") {
    return { tenantId: DEMO_TENANT_ID, createdBy: DEMO_USER_ID };
  }
  try {
    return {
      tenantId: localStorage.getItem("tenantId") ?? sessionStorage.getItem("tenantId") ?? DEMO_TENANT_ID,
      createdBy: localStorage.getItem("userId") ?? sessionStorage.getItem("userId") ?? DEMO_USER_ID,
    };
  } catch {
    return { tenantId: DEMO_TENANT_ID, createdBy: DEMO_USER_ID };
  }
}

export type CreateJobFormPayload = {
  company: string;
  position: string;
  source: string;
  status: string;
  priority: string;
  location?: string;
  jobUrl?: string;
  salaryRange?: string;
  deadline?: string;
  description?: string;
};

/** Body for POST /jobs (includes tenantId/createdBy required by API validation). */
export function buildCreateJobPayload(input: CreateJobFormPayload): Record<string, unknown> {
  const ids = tenantIdsForJobCreate();
  const payload: Record<string, unknown> = {
    ...ids,
    company: input.company.trim(),
    position: input.position.trim(),
    title: input.position.trim(),
    source: input.source,
    status: input.status,
    priority: input.priority,
  };
  const loc = input.location?.trim();
  if (loc) payload.location = loc;
  const url = input.jobUrl?.trim();
  if (url) payload.jobUrl = url;
  const salary = input.salaryRange?.trim();
  if (salary) payload.salaryRange = salary;
  const desc = input.description?.trim();
  if (desc) payload.description = desc;
  const d = input.deadline?.trim();
  if (d) {
    payload.deadline = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00.000Z`).toISOString() : d;
  }
  return payload;
}

export function listJobs(params?: Record<string, unknown>) {
  return apiFetch<Job[]>(withQuery("/jobs", params as Record<string, string | number | boolean | null | undefined>));
}
export function getJob(id: string) { return apiFetch<Job>(`/jobs/${id}`); }
export function createJob(payload: Record<string, unknown>) { return apiFetch<Job>("/jobs", { method: "POST", body: payload }); }
export function updateJob(id: string, payload: Record<string, unknown>) { return apiFetch<Job>(`/jobs/${id}`, { method: "PATCH", body: payload }); }
export function archiveJob(id: string) { return apiFetch(`/jobs/${id}/archive`, { method: "DELETE" }); }
export function intakeTest(payload: Record<string, unknown>) { return apiFetch("/jobs/intake-test", { method: "POST", body: payload }); }
export function generateResearch(id: string, options?: { execute?: boolean }) {
  return apiFetch<JobQueueEnqueueResponse>(
    withQuery(`/jobs/${id}/generate-research`, { execute: options?.execute } as Record<string, string | number | boolean | null | undefined>),
    { method: "POST" }
  );
}
export function generateDraft(id: string, options?: { execute?: boolean }) {
  return apiFetch<JobQueueEnqueueResponse>(
    withQuery(`/jobs/${id}/generate-draft`, { execute: options?.execute } as Record<string, string | number | boolean | null | undefined>),
    { method: "POST" }
  );
}
export function runAiProcessing(id: string, options?: Record<string, unknown>) {
  return apiFetch<JobQueueEnqueueResponse>(
    withQuery(`/jobs/${id}/ai-processing/run`, { execute: options?.execute as boolean } as Record<string, string | number | boolean | null | undefined>),
    { method: "POST", body: options }
  );
}
export function provisionFolders(id: string, options?: { execute?: boolean }) {
  return apiFetch<JobQueueEnqueueResponse>(
    withQuery(`/jobs/${id}/folders/provision`, { execute: options?.execute } as Record<string, string | number | boolean | null | undefined>),
    { method: "POST" }
  );
}
export function checkDuplicate(id: string) {
  return apiFetch<JobDuplicateCheckResponse>(`/jobs/${id}/check-duplicate`, { method: "POST" });
}
