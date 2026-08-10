/**
 * Minimal Unipile REST client (v1 DSN style used by hosted auth + emails).
 */

function stripEnv(raw: string | undefined): string {
  return (raw ?? "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

export function unipileConfigured(): boolean {
  return Boolean(stripEnv(process.env.UNIPILE_DSN) && stripEnv(process.env.UNIPILE_API_KEY));
}

/**
 * Supports either:
 * - full DSN with port: https://api59.unipile.com:12345
 * - or base + UNIPILE_PORT (uses ?port= for environments that block custom ports)
 */
export function getUnipileDsn(): string {
  const dsn = stripEnv(process.env.UNIPILE_DSN).replace(/\/$/, "");
  if (!dsn) throw new Error("UNIPILE_DSN is not set");
  return dsn;
}

function getUnipileApiKey(): string {
  const key = stripEnv(process.env.UNIPILE_API_KEY);
  if (!key) throw new Error("UNIPILE_API_KEY is not set");
  return key;
}

function withOptionalPortQuery(url: URL): void {
  const portOnly = stripEnv(process.env.UNIPILE_PORT);
  if (!portOnly) return;
  // Docs: when custom ports are blocked, use https://apiX.unipile.com/...?port=XXXXX
  if (!url.searchParams.has("port")) url.searchParams.set("port", portOnly);
}

export async function unipileFetch<T>(
  path: string,
  init?: RequestInit & { query?: Record<string, string | number | undefined> }
): Promise<T> {
  const dsn = getUnipileDsn();
  const url = new URL(`${dsn}${path.startsWith("/") ? path : `/${path}`}`);
  if (init?.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v === undefined || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  withOptionalPortQuery(url);

  const { query: _q, ...rest } = init ?? {};
  const apiKey = getUnipileApiKey();
  const res = await fetch(url.toString(), {
    ...rest,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-API-KEY": apiKey,
      ...(rest.headers ?? {}),
    },
  });

  const text = await res.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text };
  }

  if (!res.ok) {
    const detail =
      typeof json === "object" && json && "message" in json
        ? String((json as { message: unknown }).message)
        : "";
    if (res.status === 401) {
      throw new Error(
        "Unipile HTTP 401 — invalid API key or DSN mismatch. In Unipile dashboard copy Access Token + DSN again (no quotes), set UNIPILE_API_KEY and UNIPILE_DSN on Railway API, then redeploy."
      );
    }
    throw new Error(detail || `Unipile HTTP ${res.status}`);
  }

  return json as T;
}

export type UnipileHostedAuthResponse = {
  object?: string;
  url: string;
};

export type UnipileEmailAttendee = {
  display_name?: string;
  identifier?: string;
  identifier_type?: string;
};

export type UnipileEmail = {
  id?: string;
  email_id?: string;
  account_id?: string;
  subject?: string;
  body?: string;
  body_plain?: string;
  date?: string;
  message_id?: string;
  provider_id?: string;
  folders?: string[];
  role?: string;
  from_attendee?: UnipileEmailAttendee;
  to_attendees?: UnipileEmailAttendee[];
};

export async function createUnipileHostedAuthLink(input: {
  name: string;
  notifyUrl: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
  providers?: string[];
  expiresInMinutes?: number;
}): Promise<UnipileHostedAuthResponse> {
  const dsn = getUnipileDsn();
  const expiresOn = new Date(Date.now() + (input.expiresInMinutes ?? 30) * 60_000).toISOString();
  return unipileFetch<UnipileHostedAuthResponse>("/api/v1/hosted/accounts/link", {
    method: "POST",
    body: JSON.stringify({
      type: "create",
      providers: input.providers ?? ["GOOGLE"],
      api_url: dsn,
      expiresOn,
      notify_url: input.notifyUrl,
      name: input.name,
      success_redirect_url: input.successRedirectUrl,
      failure_redirect_url: input.failureRedirectUrl,
    }),
  });
}

export async function listUnipileEmails(input: {
  accountId: string;
  limit?: number;
}): Promise<{ items?: UnipileEmail[]; data?: UnipileEmail[] }> {
  return unipileFetch("/api/v1/emails", {
    method: "GET",
    query: {
      account_id: input.accountId,
      limit: input.limit ?? 25,
    },
  });
}

export async function getUnipileEmail(input: {
  emailId: string;
  accountId: string;
}): Promise<UnipileEmail> {
  return unipileFetch(`/api/v1/emails/${encodeURIComponent(input.emailId)}`, {
    method: "GET",
    query: { account_id: input.accountId },
  });
}

export async function getUnipileAccount(accountId: string): Promise<Record<string, unknown>> {
  return unipileFetch(`/api/v1/accounts/${encodeURIComponent(accountId)}`, { method: "GET" });
}

export type UnipileWebhookRow = {
  id?: string;
  request_url?: string;
  source?: string;
  enabled?: boolean;
  name?: string;
};

/** List registered Unipile webhooks (v1). */
export async function listUnipileWebhooks(): Promise<UnipileWebhookRow[]> {
  const res = await unipileFetch<{ items?: UnipileWebhookRow[]; data?: UnipileWebhookRow[] } | UnipileWebhookRow[]>(
    "/api/v1/webhooks",
    { method: "GET" }
  );
  if (Array.isArray(res)) return res;
  return res.items ?? res.data ?? [];
}

/**
 * Register a global email webhook once for this DSN (mail_received).
 * Idempotent: skips if request_url already registered.
 */
export async function ensureUnipileEmailWebhook(input: {
  requestUrl: string;
  secret?: string;
}): Promise<{ created: boolean; skipped: boolean }> {
  const requestUrl = input.requestUrl.replace(/\/$/, "");
  const existing = await listUnipileWebhooks();
  const already = existing.some((w) => String(w.request_url ?? "").replace(/\/$/, "") === requestUrl);
  if (already) return { created: false, skipped: true };

  const headers: Array<{ key: string; value: string }> = [];
  if (input.secret) {
    headers.push({ key: "X-Unipile-Webhook-Secret", value: input.secret });
  }

  await unipileFetch("/api/v1/webhooks", {
    method: "POST",
    body: JSON.stringify({
      request_url: requestUrl,
      source: "email",
      events: ["mail_received"],
      format: "json",
      enabled: true,
      name: "newjobguru-email-intake",
      ...(headers.length ? { headers } : {}),
    }),
  });

  return { created: true, skipped: false };
}
