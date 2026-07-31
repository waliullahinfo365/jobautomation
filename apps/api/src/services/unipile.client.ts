/**
 * Minimal Unipile REST client (v1 DSN style used by hosted auth + emails).
 */
export function unipileConfigured(): boolean {
  return Boolean(process.env.UNIPILE_DSN?.trim() && process.env.UNIPILE_API_KEY?.trim());
}

export function getUnipileDsn(): string {
  const dsn = process.env.UNIPILE_DSN?.trim().replace(/\/$/, "");
  if (!dsn) throw new Error("UNIPILE_DSN is not set");
  return dsn;
}

function getUnipileApiKey(): string {
  const key = process.env.UNIPILE_API_KEY?.trim();
  if (!key) throw new Error("UNIPILE_API_KEY is not set");
  return key;
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

  const { query: _q, ...rest } = init ?? {};
  const res = await fetch(url.toString(), {
    ...rest,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-API-KEY": getUnipileApiKey(),
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
    const msg =
      typeof json === "object" && json && "message" in json
        ? String((json as { message: unknown }).message)
        : `Unipile HTTP ${res.status}`;
    throw new Error(msg);
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
