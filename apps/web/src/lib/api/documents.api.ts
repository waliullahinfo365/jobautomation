import type { DocumentRecord } from "@/types/document";
import { apiFetch, withQuery } from "./client";

export function listDocuments(params?: Record<string, unknown>) { return apiFetch<DocumentRecord[]>(withQuery("/documents", params as any)); }
export function getDocument(id: string) { return apiFetch<DocumentRecord>(`/documents/${id}`); }
export function createDocument(payload: Record<string, unknown>) { return apiFetch<DocumentRecord>("/documents", { method: "POST", body: payload }); }
export function updateDocument(id: string, payload: Record<string, unknown>) { return apiFetch<DocumentRecord>(`/documents/${id}`, { method: "PATCH", body: payload }); }
export function routeCv(id: string, payload: Record<string, unknown>) { return apiFetch(`/documents/${id}/route-cv`, { method: "POST", body: payload }); }
export function exportPdf(id: string, options?: { execute?: boolean }) { return apiFetch(withQuery(`/documents/${id}/export-pdf`, { execute: options?.execute } as any), { method: "POST", body: {} }); }
