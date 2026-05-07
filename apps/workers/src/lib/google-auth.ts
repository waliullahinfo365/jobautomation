import crypto from "node:crypto";
import { IntegrationConnectionModel } from "@jobflow/database/models";

const DEV_PREFIX = "dev-insecure-plain:";
const ENC_PREFIX = "enc:v1:";

function encryptionKeyBytes(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  return crypto.createHash("sha256").update(raw, "utf8").digest();
}

function encryptSecretForWorker(value: string): string {
  const key = encryptionKeyBytes();
  if (!key) {
    if ((process.env.NODE_ENV ?? "development") === "development") {
      return `${DEV_PREFIX}${Buffer.from(value, "utf8").toString("base64url")}`;
    }
    throw new Error("ENCRYPTION_KEY missing; cannot encrypt integration token");
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${Buffer.concat([iv, tag, enc]).toString("base64url")}`;
}

export function decryptSecretForWorker(stored: string): string {
  if (stored.startsWith(DEV_PREFIX)) {
    return Buffer.from(stored.slice(DEV_PREFIX.length), "base64url").toString("utf8");
  }
  if (!stored.startsWith(ENC_PREFIX)) {
    throw new Error("Unknown encrypted token format");
  }
  const key = encryptionKeyBytes();
  if (!key) throw new Error("ENCRYPTION_KEY missing; cannot decrypt integration token");
  const raw = Buffer.from(stored.slice(ENC_PREFIX.length), "base64url");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export type ProviderName = "Gmail" | "Google Drive" | "Google Calendar";

export type GoogleAuthContext = {
  accessToken: string;
  scopes: string[];
  connected: boolean;
  reason?: string;
};

async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt?: Date;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET missing; cannot refresh Google OAuth token");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google token refresh failed (${response.status}): ${text.slice(0, 220)}`);
  }
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("Google token refresh returned no access_token");
  return {
    accessToken: json.access_token,
    expiresAt: json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : undefined,
  };
}

export async function loadGoogleAccessToken(input: {
  tenantId: string;
  provider: ProviderName;
  requiredScopes: string[];
}): Promise<GoogleAuthContext> {
  const conn = await IntegrationConnectionModel.findOne({
    tenantId: input.tenantId,
    provider: input.provider,
  });
  if (!conn) {
    return { connected: false, accessToken: "", scopes: [], reason: `${input.provider} integration not connected` };
  }
  const metadata = (conn.metadata as Record<string, unknown> | undefined) ?? {};
  const isDemoConnection =
    conn.connectedEmail === "oauth-demo-user@example.com" ||
    metadata.demoConnection === true ||
    metadata.stub === true ||
    metadata.reconnectRequired === true;
  if (isDemoConnection) {
    return {
      connected: false,
      accessToken: "",
      scopes: conn.scopes ?? [],
      reason: "Google reconnect required: demo connection cannot call Google APIs.",
    };
  }
  if (conn.status !== "Connected") {
    return {
      connected: false,
      accessToken: "",
      scopes: conn.scopes ?? [],
      reason: `${input.provider} integration status is ${conn.status}`,
    };
  }
  if (!conn.accessTokenEncrypted) {
    return { connected: false, accessToken: "", scopes: conn.scopes ?? [], reason: "Missing stored OAuth token" };
  }

  const scopes = conn.scopes ?? [];
  const missingScopes = input.requiredScopes.filter((scope) => !scopes.includes(scope));
  if (missingScopes.length > 0) {
    return {
      connected: false,
      accessToken: "",
      scopes,
      reason: `Missing required scopes: ${missingScopes.join(", ")}`,
    };
  }

  let accessToken = decryptSecretForWorker(conn.accessTokenEncrypted);
  const refreshToken = conn.refreshTokenEncrypted ? decryptSecretForWorker(conn.refreshTokenEncrypted) : "";
  const isExpired = conn.expiresAt ? conn.expiresAt.getTime() <= Date.now() + 60_000 : false;
  if (isExpired && refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    accessToken = refreshed.accessToken;
    conn.accessTokenEncrypted = encryptSecretForWorker(accessToken);
    if (refreshed.expiresAt) conn.expiresAt = refreshed.expiresAt;
    await conn.save();
  }

  return { connected: true, accessToken, scopes };
}

export async function googleApiJson<T>(input: {
  url: string;
  method?: "GET" | "POST" | "PATCH";
  accessToken: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  const response = await fetch(input.url, {
    method: input.method ?? "GET",
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      "content-type": "application/json",
    },
    body: input.body ? JSON.stringify(input.body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google API ${input.method ?? "GET"} failed (${response.status}): ${text.slice(0, 300)}`);
  }
  return (await response.json()) as T;
}
