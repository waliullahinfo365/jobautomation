import type { Interview } from "@/types/interview";
import { apiFetch, withQuery } from "./client";

export function listInterviews(params?: Record<string, unknown>) { return apiFetch<Interview[]>(withQuery("/interviews", params as any)); }
export function getInterview(id: string) { return apiFetch<Interview>(`/interviews/${id}`); }
export function createInterview(payload: Record<string, unknown>) { return apiFetch<Interview>("/interviews", { method: "POST", body: payload }); }
export function updateInterview(id: string, payload: Record<string, unknown>) { return apiFetch<Interview>(`/interviews/${id}`, { method: "PATCH", body: payload }); }
export function createCalendarEvent(id: string, options?: { execute?: boolean }) { return apiFetch(withQuery(`/interviews/${id}/create-calendar-event`, { execute: options?.execute } as any), { method: "POST", body: {} }); }
export function markComplete(id: string) { return apiFetch(`/interviews/${id}/mark-complete`, { method: "POST", body: {} }); }
