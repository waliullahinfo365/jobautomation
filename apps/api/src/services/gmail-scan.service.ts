import { IntegrationConnectionModel } from "@jobflow/database/models";
import { gmailApiJson, parseGmailMessageToPayload } from "@jobflow/integrations/gmail/gmail.service";
import type { JobIntakeEmailPayload } from "@jobflow/shared/types/job";
import { decryptSecret } from "../utils/encryption";
import { ApiError } from "../utils/errors";

interface GmailMessageListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

interface GmailMessage {
  id: string;
  threadId: string;
  internalDate?: string;
  snippet?: string;
  labelIds?: string[];
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{ mimeType: string; body?: { data?: string } }>;
  };
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new ApiError("Google OAuth not configured", 503, "CONFIG_ERROR");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(`Token refresh failed: ${text.slice(0, 200)}`, 401, "AUTH_ERROR");
  }
  const json = await res.json() as { access_token?: string };
  if (!json.access_token) throw new ApiError("No access_token in refresh response", 401, "AUTH_ERROR");
  return json.access_token;
}

function extractBodyText(message: GmailMessage): string {
  // Try plain text parts first, then html parts
  const parts = message.payload?.parts ?? [];
  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return Buffer.from(part.body.data, "base64url").toString("utf8");
    }
  }
  // Fallback: top-level body
  if (message.payload?.body?.data) {
    return Buffer.from(message.payload.body.data, "base64url").toString("utf8");
  }
  // Last resort: snippet
  return message.snippet ?? "";
}

export async function getGmailAccessTokenForTenant(tenantId: string): Promise<string> {
  const conn = await IntegrationConnectionModel.findOne({
    tenantId,
    provider: "Gmail",
    status: { $in: ["Connected", "Needs Attention"] },
  }).lean() as Record<string, unknown> | null;

  if (!conn) throw new ApiError("Gmail not connected. Please connect Gmail in Settings.", 422, "INTEGRATION_NOT_CONNECTED");

  const refreshEnc = conn.refreshTokenEncrypted as string | undefined;
  if (!refreshEnc) throw new ApiError("Gmail refresh token missing. Please reconnect Gmail in Settings.", 422, "INTEGRATION_TOKEN_MISSING");

  const refreshToken = decryptSecret(refreshEnc);
  return refreshGoogleAccessToken(refreshToken);
}

export interface GmailScanOptions {
  tenantId: string;
  /** Max emails to scan per run. Default: 50 */
  maxMessages?: number;
  /** Only scan emails newer than this many days. Default: 7 */
  daysBack?: number;
  /** Gmail label filter (e.g. "INBOX"). Default: "in:inbox OR in:Jobs" */
  labelFilter?: string;
}

export interface GmailScanResult {
  scanned: number;
  payloads: JobIntakeEmailPayload[];
  errors: string[];
}

export async function scanGmailInbox(opts: GmailScanOptions): Promise<GmailScanResult> {
  const { tenantId, maxMessages = 50, daysBack = 7, labelFilter } = opts;

  const accessToken = await getGmailAccessTokenForTenant(tenantId);

  // Build query: all inbox mail from the last N days
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - daysBack);
  const afterEpoch = Math.floor(afterDate.getTime() / 1000);

  // Use caller-supplied filter or default: INBOX + Jobs label
  const q = labelFilter ?? `in:inbox after:${afterEpoch}`;

  const listRes = await gmailApiJson<GmailMessageListResponse>({
    accessToken,
    path: "users/me/messages",
    query: { q, maxResults: maxMessages },
  });

  const messageRefs = listRes.messages ?? [];
  const payloads: JobIntakeEmailPayload[] = [];
  const errors: string[] = [];

  // Fetch full message for each ref
  await Promise.allSettled(
    messageRefs.map(async (ref) => {
      try {
        const msg = await gmailApiJson<GmailMessage>({
          accessToken,
          path: `users/me/messages/${ref.id}`,
          query: { format: "full" },
        });

        const payload = parseGmailMessageToPayload(msg);
        // Override bodyText with full extracted text (parseGmailMessageToPayload only uses top-level body)
        const fullBody = extractBodyText(msg);
        if (fullBody) payload.bodyText = fullBody;

        payloads.push(payload);
      } catch (err) {
        errors.push(`Message ${ref.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    })
  );

  return { scanned: messageRefs.length, payloads, errors };
}
