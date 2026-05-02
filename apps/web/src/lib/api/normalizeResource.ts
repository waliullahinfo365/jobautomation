/**
 * Helpers to normalize API response shapes.
 * Backend may return plain arrays, { items }, { data }, or paginated envelopes.
 * apiFetch already unwraps the top-level { success, data } envelope,
 * so these helpers operate on what's inside `data`.
 */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function normalizeListResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (Array.isArray(obj.records)) return obj.records as T[];
  }
  return [];
}

export function normalizePagination(payload: unknown): PaginationMeta | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;
  const total = typeof obj.total === "number" ? obj.total : 0;
  const page = typeof obj.page === "number" ? obj.page : 1;
  const limit = typeof obj.limit === "number" ? obj.limit : total;
  return { total, page, limit, hasMore: page * limit < total };
}

export function normalizeSingleResource<T>(payload: unknown): T | undefined {
  if (!payload) return undefined;
  return payload as T;
}
