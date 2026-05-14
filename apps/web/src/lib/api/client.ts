import { env, AUTH_TOKEN_STORAGE_KEY, DEMO_TENANT_ID, DEMO_USER_ID } from "@/config/env";
import { showError } from "@/lib/ui/toast";

if (process.env.NODE_ENV !== "production") {
  console.info("[jobflow/api] API base URL:", env.api.url);
}

type QueryValue = string | number | boolean | null | undefined;

export class ApiError extends Error {
  status: number;
  code?: string;
  requestId?: string;
  details?: unknown;
  isNetworkError?: boolean;

  constructor(message: string, status = 500, opts?: { code?: string; requestId?: string; details?: unknown; isNetworkError?: boolean }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = opts?.code;
    this.requestId = opts?.requestId;
    this.details = opts?.details;
    this.isNetworkError = opts?.isNetworkError;
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string | { message?: string; code?: string; requestId?: string; details?: unknown };
  message?: string;
};

function fromStorage(key: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function handleUnauthorized(path: string): void {
  if (typeof window === "undefined") return;
  const authPath = path.startsWith("/auth/login") || path.startsWith("/auth/register");
  clearAuthToken();
  try {
    localStorage.removeItem("tenantId");
    localStorage.removeItem("userId");
    sessionStorage.removeItem("tenantId");
    sessionStorage.removeItem("userId");
  } catch {
    /* ignore */
  }
  if (authPath) return;
  const protectedPrefixes = [
    "/dashboard",
    "/jobs",
    "/applications",
    "/contacts",
    "/interviews",
    "/documents",
    "/reports",
    "/automation",
    "/settings",
    "/system-status",
    "/demo",
  ];
  const onProtected = protectedPrefixes.some((p) => window.location.pathname.startsWith(p));
  if (onProtected) {
    showError("Session expired. Please login again.");
    window.location.replace("/login");
  }
}

export function getAuthToken(): string | undefined {
  return fromStorage(AUTH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function clearAuthToken(): void {
  setAuthToken(null);
}

export function getApiHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAuthToken();
  const base: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    base.Authorization = `Bearer ${token}`;
  } else {
    base["x-tenant-id"] = fromStorage("tenantId") ?? DEMO_TENANT_ID;
    base["x-user-id"] = fromStorage("userId") ?? DEMO_USER_ID;
  }
  return {
    ...base,
    ...(extra as Record<string, string> | undefined),
  };
}

export function withQuery(path: string, query?: Record<string, QueryValue>): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function safelyParseJson(text: string): unknown {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export function normalizeApiResponse<T>(raw: unknown): T {
  const envelope = raw as ApiEnvelope<T>;
  if (!envelope?.success) {
    const err = envelope?.error;
    const message = typeof err === "string" ? err : err?.message || envelope?.message || "Request failed";
    throw new ApiError(message, 500, {
      code: typeof err === "string" ? undefined : err?.code,
      requestId: typeof err === "string" ? undefined : err?.requestId,
      details: typeof err === "string" ? undefined : err?.details,
    });
  }
  return envelope.data as T;
}

// ---------------------------------------------------------------------------
// Request deduplication + short-lived response cache (with global persistence)
//
// We store state on `globalThis` so the cache survives Next.js HMR module
// reloads. Without this, Fast Refresh would reset module-level Maps and a
// burst of requests could slip through the gap.
//
// Three layers of protection:
//   1. In-flight dedup — concurrent calls reuse the same Promise.
//   2. TTL response cache — GETs resolve from memory for DEDUPE_TTL_MS.
//   3. Hard rate-limit floor — even if both above somehow miss, the same GET
//      can never hit the network more than once per RATE_LIMIT_MS.
// ---------------------------------------------------------------------------

/** Longer TTL in dev so remount/HMR loops do not hammer the API for identical GET keys. */
const DEDUPE_TTL_MS = process.env.NODE_ENV === "production" ? 1500 : 15_000;
const RATE_LIMIT_MS = process.env.NODE_ENV === "production" ? 500 : 2000;

type CacheEntry = { value: unknown; expiresAt: number };

type GlobalApiState = {
  inflight: Map<string, Promise<unknown>>;
  cache: Map<string, CacheEntry>;
  lastFetchAt: Map<string, number>;
};

const G = globalThis as unknown as { __JOBFLOW_API__?: GlobalApiState };
if (!G.__JOBFLOW_API__) {
  G.__JOBFLOW_API__ = {
    inflight: new Map(),
    cache: new Map(),
    lastFetchAt: new Map(),
  };
}
const inflight = G.__JOBFLOW_API__.inflight;
const cache = G.__JOBFLOW_API__.cache;
const lastFetchAt = G.__JOBFLOW_API__.lastFetchAt;

const DEBUG = typeof window !== "undefined" && process.env.NODE_ENV !== "production";
function dbg(...args: unknown[]): void {
  if (DEBUG) console.debug("[apiFetch]", ...args);
}

function cacheKey(method: string, path: string): string {
  return `${method} ${path}`;
}

function readFreshCache(key: string): { hit: true; value: unknown } | { hit: false } {
  const entry = cache.get(key);
  if (!entry) return { hit: false };
  if (entry.expiresAt < Date.now()) {
    // Expired but we keep the entry around for the rate-limit floor to reuse.
    return { hit: false };
  }
  return { hit: true, value: entry.value };
}

/** Manually clear cached GETs (use after mutations). Pass a path prefix or omit to clear all. */
export function invalidateApiCache(pathPrefix?: string): void {
  if (!pathPrefix) {
    cache.clear();
    inflight.clear();
    lastFetchAt.clear();
    return;
  }
  for (const k of Array.from(cache.keys())) {
    if (k.includes(pathPrefix)) cache.delete(k);
  }
  for (const k of Array.from(inflight.keys())) {
    if (k.includes(pathPrefix)) inflight.delete(k);
  }
  for (const k of Array.from(lastFetchAt.keys())) {
    if (k.includes(pathPrefix)) lastFetchAt.delete(k);
  }
}

async function performFetch<T>(
  path: string,
  options: {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    headers?: HeadersInit;
    signal?: AbortSignal;
    timeoutMs: number;
  }
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  const signal = options.signal ?? controller.signal;

  try {
    const response = await fetch(`${env.api.url}${path}`, {
      method: options.method,
      headers: getApiHeaders(options.headers),
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal,
      cache: "no-store",
    });

    const text = await response.text();
    if (response.status === 304) {
      throw new ApiError("API returned 304 Not Modified without a JSON body", 0, { isNetworkError: true });
    }
    const parsed = safelyParseJson(text) as ApiEnvelope<T>;

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized(path);
      }
      const err = parsed?.error;
      throw new ApiError(
        typeof err === "string" ? err : err?.message || `Request failed (${response.status})`,
        response.status,
        {
          code: typeof err === "string" ? undefined : err?.code,
          requestId: typeof err === "string" ? undefined : err?.requestId,
          details: typeof err === "string" ? undefined : err?.details,
        }
      );
    }

    return normalizeApiResponse<T>(parsed);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out", 408, { isNetworkError: true });
    }
    throw new ApiError(error instanceof Error ? error.message : "Network request failed", 0, { isNetworkError: true });
  } finally {
    clearTimeout(timer);
  }
}

export async function apiFetch<T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    headers?: HeadersInit;
    signal?: AbortSignal;
    timeoutMs?: number;
  }
): Promise<T> {
  const method = options?.method ?? "GET";
  const timeoutMs = options?.timeoutMs ?? 20_000;

  // Mutations bypass caching and invalidate the GET cache for the affected resource.
  if (method !== "GET") {
    const result = await performFetch<T>(path, { method, body: options?.body, headers: options?.headers, signal: options?.signal, timeoutMs });
    // Use the first path segment as the resource (e.g. POST /jobs/123/archive → /jobs).
    const resource = path.split("?")[0].split("/").filter(Boolean)[0];
    invalidateApiCache(resource ? `/${resource}` : undefined);
    return result;
  }

  const key = cacheKey(method, path);

  // Layer 1: TTL response cache.
  const fresh = readFreshCache(key);
  if (fresh.hit) {
    dbg("cache-hit", path);
    return fresh.value as T;
  }

  // Layer 2: in-flight dedup.
  const existing = inflight.get(key);
  if (existing) {
    dbg("inflight-share", path);
    return existing as Promise<T>;
  }

  // Layer 3: hard rate-limit floor. If a network call to the same key fired
  // within RATE_LIMIT_MS, return whatever stale value we have (the previous
  // response). If we genuinely have nothing yet, fall through to network.
  const last = lastFetchAt.get(key);
  if (last !== undefined && Date.now() - last < RATE_LIMIT_MS) {
    const stale = cache.get(key);
    if (stale) {
      dbg("rate-limited (stale-cache)", path);
      return stale.value as T;
    }
    dbg("rate-limited but no data yet — falling through", path);
  }

  dbg("network", path);
  lastFetchAt.set(key, Date.now());

  const p = performFetch<T>(path, { method, body: options?.body, headers: options?.headers, signal: options?.signal, timeoutMs })
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + DEDUPE_TTL_MS });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, p);
  return p;
}
