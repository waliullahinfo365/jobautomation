import crypto from "node:crypto";
import { IntegrationConnectionModel } from "@jobflow/database/models";
import { GOOGLE_DOCUMENTS_SCOPE, scopeGranted } from "@jobflow/shared/constants/googleScopes";

const DEV_PREFIX = "dev-insecure-plain:";
const ENC_PREFIX = "enc:v1:";

function encryptionKeyBytes(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  return crypto.createHash("sha256").update(raw, "utf8").digest();
}

export function encryptSecretForWorker(value: string): string {
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
  /** Scopes still required after comparing granted vs requested */
  missingScopes?: string[];
};

export type GoogleIntegrationProvider = "Google Drive" | "Google Docs" | "Gmail" | "Google Calendar";

export type GoogleApiFailureMeta = {
  googleApi: true;
  provider: GoogleIntegrationProvider;
  endpointType: string;
  httpMethod: string;
  statusCode: number;
  googleErrorReason?: string;
  googleErrorMessage?: string;
  requiredScope?: string;
  reconnectRequired: boolean;
  fallbackUsed: boolean;
  /** Set when Docs API returns accessNotConfigured / API disabled in project */
  googleDocsApiNotEnabled?: boolean;
};

export class GoogleApiHttpError extends Error {
  readonly meta: GoogleApiFailureMeta;

  constructor(message: string, meta: GoogleApiFailureMeta) {
    super(message);
    this.name = "GoogleApiHttpError";
    this.meta = meta;
  }
}

function parseGoogleErrorPayload(text: string): { reason?: string; message?: string } {
  try {
    const j = JSON.parse(text) as {
      error?: {
        errors?: Array<{ reason?: string; message?: string }>;
        message?: string;
        status?: string;
      };
    };
    const e = j.error;
    const first = e?.errors?.[0];
    return {
      reason: first?.reason ?? e?.status,
      message: first?.message ?? e?.message,
    };
  } catch {
    return {};
  }
}

function truncateGoogleMessage(s: string, max = 240): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function classifyGoogleRequest(
  url: string,
  method: string
): { provider: GoogleIntegrationProvider; endpointType: string } {
  const base = url.split("?")[0];
  if (base.includes("gmail.googleapis.com")) {
    return { provider: "Gmail", endpointType: "gmail.api" };
  }
  if (base.includes("googleapis.com/calendar/v3")) {
    return { provider: "Google Calendar", endpointType: "calendar.events" };
  }
  if (base.includes("docs.googleapis.com")) {
    if (base.includes(":batchUpdate")) return { provider: "Google Docs", endpointType: "docs.documents.batchUpdate" };
    return { provider: "Google Docs", endpointType: "docs.documents" };
  }
  if (base.includes("drive/v3/files")) {
    const tail = base.split("/files/")[1] ?? "";
    if (method === "POST" && !tail) return { provider: "Google Drive", endpointType: "drive.files.create" };
    if (method === "POST" && tail.endsWith("/copy")) return { provider: "Google Drive", endpointType: "drive.files.copy" };
    if (method === "PATCH") return { provider: "Google Drive", endpointType: "drive.files.update" };
    if (method === "GET") return { provider: "Google Drive", endpointType: "drive.files.list" };
    return { provider: "Google Drive", endpointType: "drive.files" };
  }
  return { provider: "Google Drive", endpointType: "google.api" };
}

function inferRequiredScope(endpointType: string, statusCode: number): string | undefined {
  if (statusCode !== 403 && statusCode !== 401) return undefined;
  switch (endpointType) {
    case "docs.documents.batchUpdate":
      return "https://www.googleapis.com/auth/documents";
    case "drive.files.create":
    case "drive.files.copy":
    case "drive.files.update":
    case "drive.files.list":
    case "drive.files":
      return "https://www.googleapis.com/auth/drive.file";
    default:
      return undefined;
  }
}

export function integrationProviderForGoogleFailure(meta: GoogleApiFailureMeta): ProviderName {
  if (meta.provider === "Gmail") return "Gmail";
  if (meta.provider === "Google Calendar") return "Google Calendar";
  return "Google Drive";
}

export async function persistGoogleReconnectHint(input: {
  tenantId: string;
  provider: ProviderName;
  meta: Pick<GoogleApiFailureMeta, "endpointType" | "statusCode" | "googleErrorReason" | "requiredScope">;
}): Promise<void> {
  await IntegrationConnectionModel.updateOne(
    { tenantId: input.tenantId, provider: input.provider, status: "Connected" },
    {
      $set: {
        "metadata.reconnectRequired": true,
        "metadata.reconnectBanner": "Reconnect required because Google scopes changed.",
        "metadata.lastGoogleApiFailure": {
          endpointType: input.meta.endpointType,
          statusCode: input.meta.statusCode,
          googleErrorReason: input.meta.googleErrorReason,
          requiredScope: input.meta.requiredScope,
          recordedAt: new Date().toISOString(),
        },
      },
    }
  );
}

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
    metadata.stub === true;
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
  const missingScopes = input.requiredScopes.filter((scope) => !scopeGranted(scopes, scope));
  if (missingScopes.length > 0) {
    if (conn.status === "Connected") {
      await IntegrationConnectionModel.updateOne(
        { _id: conn._id },
        {
          $set: {
            "metadata.reconnectRequired": true,
            "metadata.reconnectBanner": missingScopes.includes(GOOGLE_DOCUMENTS_SCOPE)
              ? "Reconnect required — Google Docs scope missing."
              : "Reconnect required because Google scopes changed.",
            "metadata.missingScopes": missingScopes,
            "metadata.googleDocsScopeMissing": missingScopes.includes(GOOGLE_DOCUMENTS_SCOPE),
          },
        }
      );
    }
    return {
      connected: false,
      accessToken: "",
      scopes,
      reason: `Missing required scopes: ${missingScopes.join(", ")}`,
      missingScopes,
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
  const method = input.method ?? "GET";
  const response = await fetch(input.url, {
    method,
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      "content-type": "application/json",
    },
    body: input.body ? JSON.stringify(input.body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    const parsed = parseGoogleErrorPayload(text);
    const statusCode = response.status;
    const { provider, endpointType } = classifyGoogleRequest(input.url, method);
    const requiredScope = inferRequiredScope(endpointType, statusCode);
    const reconnectRequired = statusCode === 403 || statusCode === 401;
    const msgLower = (parsed.message ?? "").toLowerCase();
    const docsEndpoint = endpointType.includes("docs") || input.url.includes("docs.googleapis.com");
    const googleDocsApiNotEnabled =
      docsEndpoint &&
      (parsed.reason === "accessNotConfigured" ||
        msgLower.includes("has not been used") ||
        msgLower.includes("it is disabled") ||
        msgLower.includes("api is disabled") ||
        msgLower.includes("enable the google docs api"));
    const meta: GoogleApiFailureMeta = {
      googleApi: true,
      provider,
      endpointType,
      httpMethod: method,
      statusCode,
      googleErrorReason: parsed.reason,
      googleErrorMessage: parsed.message ? truncateGoogleMessage(parsed.message) : undefined,
      requiredScope,
      reconnectRequired,
      fallbackUsed: false,
      googleDocsApiNotEnabled,
    };
    throw new GoogleApiHttpError(`Google API ${endpointType} failed (${statusCode})`, meta);
  }
  return (await response.json()) as T;
}

export function googleFailureMetaFromUnknown(error: unknown, fallbackEndpoint = "unknown"): GoogleApiFailureMeta {
  if (error instanceof GoogleApiHttpError) {
    return { ...error.meta, fallbackUsed: true };
  }
  const msg = error instanceof Error ? error.message : String(error);
  return {
    googleApi: true,
    provider: "Google Drive",
    endpointType: fallbackEndpoint,
    httpMethod: "?",
    statusCode: 0,
    googleErrorMessage: truncateGoogleMessage(msg),
    reconnectRequired: false,
    fallbackUsed: true,
  };
}
