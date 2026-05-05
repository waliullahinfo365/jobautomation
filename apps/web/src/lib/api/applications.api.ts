import type { Application } from "@/types/application";
import { DEMO_TENANT_ID, DEMO_USER_ID } from "@/config/env";
import { apiFetch, withQuery } from "./client";

function tenantIdsForRequest(): { tenantId: string; createdBy: string } {
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

export type CreateApplicationFormPayload = {
  company: string;
  position: string;
  jobId?: string;
  source: string;
  applicationStatus: string;
  responseStatus: string;
  followUpStatus: string;
  appliedDate: string;
  contactEmail?: string;
  jobUrl?: string;
  notes?: string;
};

/** Body for POST /applications (tenant fields required by API validation). */
export function buildCreateApplicationPayload(input: CreateApplicationFormPayload): Record<string, unknown> {
  const ids = tenantIdsForRequest();
  const payload: Record<string, unknown> = {
    ...ids,
    company: input.company.trim(),
    position: input.position.trim(),
    applicationStatus: input.applicationStatus,
    responseStatus: input.responseStatus,
    followUpStatus: input.followUpStatus,
    source: input.source,
  };
  const jid = input.jobId?.trim();
  if (jid) payload.jobId = jid;
  const email = input.contactEmail?.trim();
  if (email) payload.contactEmail = email;
  const url = input.jobUrl?.trim();
  if (url) payload.jobUrl = url;
  const notes = input.notes?.trim();
  if (notes) payload.notes = notes;
  const ad = input.appliedDate?.trim();
  if (ad) {
    payload.dateApplied = /^\d{4}-\d{2}-\d{2}$/.test(ad) ? new Date(`${ad}T12:00:00.000Z`).toISOString() : ad;
    payload.appliedAt = payload.dateApplied;
  }
  return payload;
}

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
