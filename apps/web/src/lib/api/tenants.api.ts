import { apiFetch, withQuery } from "./client";

export function getCurrentTenant() { return apiFetch("/tenants/current"); }
export function updateCurrentTenant(payload: Record<string, unknown>) { return apiFetch("/tenants/current", { method: "PATCH", body: payload }); }
export function getTenantUsage(params?: Record<string, unknown>) { return apiFetch(withQuery("/tenants/usage", params as any)); }
