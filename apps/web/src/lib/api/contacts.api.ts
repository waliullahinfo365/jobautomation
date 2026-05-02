import type { Contact } from "@/types/contact";
import { apiFetch, withQuery } from "./client";

export function listContacts(params?: Record<string, unknown>) { return apiFetch<Contact[]>(withQuery("/contacts", params as any)); }
export function getContact(id: string) { return apiFetch<Contact>(`/contacts/${id}`); }
export function createContact(payload: Record<string, unknown>) { return apiFetch<Contact>("/contacts", { method: "POST", body: payload }); }
export function updateContact(id: string, payload: Record<string, unknown>) { return apiFetch<Contact>(`/contacts/${id}`, { method: "PATCH", body: payload }); }
export function markFollowedUp(id: string) { return apiFetch(`/contacts/${id}/mark-followed-up`, { method: "POST", body: {} }); }
