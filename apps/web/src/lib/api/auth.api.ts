import { apiFetch, clearAuthToken, invalidateApiCache, setAuthToken } from "./client";

export type AuthSessionPayload = {
  accessToken: string;
  user: {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
};

function persistSession(data: AuthSessionPayload): void {
  setAuthToken(data.accessToken);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("tenantId", data.tenant.id);
      localStorage.setItem("userId", data.user.id);
    } catch {
      /* ignore */
    }
  }
  invalidateApiCache();
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  workspaceName: string;
}): Promise<AuthSessionPayload> {
  clearAuthToken();
  const data = await apiFetch<AuthSessionPayload>("/auth/register", {
    method: "POST",
    body: payload,
    headers: {},
  });
  persistSession(data);
  return data;
}

export async function login(payload: { email: string; password: string }): Promise<AuthSessionPayload> {
  clearAuthToken();
  const data = await apiFetch<AuthSessionPayload>("/auth/login", {
    method: "POST",
    body: payload,
    headers: {},
  });
  persistSession(data);
  return data;
}

export async function me(): Promise<{ user: AuthSessionPayload["user"]; tenant: AuthSessionPayload["tenant"] }> {
  return apiFetch("/auth/me", { method: "GET" });
}

export async function forgotPassword(email: string): Promise<{ ok: boolean }> {
  return apiFetch("/auth/forgot-password", { method: "POST", body: { email }, headers: {} });
}

export async function resetPassword(token: string, password: string): Promise<{ ok: boolean }> {
  return apiFetch("/auth/reset-password", { method: "POST", body: { token, password }, headers: {} });
}

export async function getGoogleLoginUrl(): Promise<{ authorizationUrl: string | null; oauthEnabled: boolean; message?: string }> {
  return apiFetch("/auth/google/url", { method: "GET", headers: {} });
}

/** Clears token locally; server logout is a stub. */
export async function logout(): Promise<void> {
  try {
    await apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST", body: {} });
  } catch {
    /* offline / stub */
  } finally {
    clearAuthToken();
  }
}
