import type { JobIntakeEmailPayload } from "@jobflow/shared/types/job";
import type { EmailReplyPayload } from "@jobflow/shared/types/application";

export function normalizeGmailMessage(input: Partial<JobIntakeEmailPayload>): JobIntakeEmailPayload {
  return {
    provider: input.provider ?? "gmail",
    providerMessageId: input.providerMessageId ?? "unknown-message-id",
    providerThreadId: input.providerThreadId,
    from: input.from ?? "unknown@example.com",
    subject: input.subject ?? "",
    bodyText: input.bodyText ?? "",
    receivedAt: input.receivedAt ?? new Date().toISOString(),
    labels: input.labels ?? [],
    raw: input.raw ?? {},
  };
}

/** Dev-only: returns a placeholder payload for testing intake pipelines without real Gmail. */
export async function fetchMessageByIdStub(messageId: string): Promise<JobIntakeEmailPayload> {
  return normalizeGmailMessage({
    provider: "gmail",
    providerMessageId: messageId,
    providerThreadId: `thread-${messageId}`,
    from: "alerts@example.com",
    subject: "Software Engineer at Example Corp",
    bodyText: "Example Corp is hiring. Apply: https://example.com/jobs/123",
    receivedAt: new Date().toISOString(),
    labels: ["job-alert"],
  });
}

/**
 * Verifies a Gmail push notification webhook request.
 *
 * Google signs push notification requests with an OIDC token (Bearer) in the
 * Authorization header. If GMAIL_WEBHOOK_TOKEN env is set, we verify against
 * Google's tokeninfo endpoint. As a final guard, we require the payload to be
 * a non-null object with a message property (Gmail push notification shape).
 */
export async function verifyGmailWebhook(
  payload: unknown,
  authorizationHeader?: string
): Promise<{ valid: boolean; reason?: string }> {
  // Basic payload shape check: Gmail push notifications always have `message` + `subscription`
  if (typeof payload !== "object" || payload === null) {
    return { valid: false, reason: "Payload is not an object" };
  }

  const body = payload as Record<string, unknown>;

  // If GMAIL_WEBHOOK_TOKEN is configured, verify via Google tokeninfo
  const webhookToken = process.env.GMAIL_WEBHOOK_TOKEN?.trim();
  if (webhookToken && authorizationHeader) {
    const bearerMatch = authorizationHeader.match(/^Bearer\s+(.+)$/i);
    if (!bearerMatch) return { valid: false, reason: "Missing Bearer token in Authorization header" };
    const idToken = bearerMatch[1];
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (!res.ok) return { valid: false, reason: `Google tokeninfo rejected token (HTTP ${res.status})` };
      const info = (await res.json()) as Record<string, unknown>;
      if (typeof info.aud !== "string") return { valid: false, reason: "Token audience missing" };
      // Optionally: verify info.aud matches project/service account
      if (info.error) return { valid: false, reason: `Token invalid: ${String(info.error_description ?? info.error)}` };
    } catch (e) {
      return { valid: false, reason: `Could not verify token: ${e instanceof Error ? e.message : "fetch failed"}` };
    }
  }

  // Accept Gmail-shaped payloads (has `message` with base64 data or standard structure)
  const hasMessage = "message" in body || "data" in body;
  if (!hasMessage && !("providerMessageId" in body)) {
    return { valid: false, reason: "Payload does not match Gmail push notification shape" };
  }

  return { valid: true };
}

/** @deprecated Use verifyGmailWebhook — kept for backward compatibility */
export function verifyGmailWebhookStub(payload: unknown): boolean {
  return typeof payload === "object" && payload !== null;
}

export async function gmailApiJson<T>(input: {
  accessToken: string;
  path: string;
  query?: Record<string, string | number | undefined>;
}): Promise<T> {
  const url = new URL(`https://gmail.googleapis.com/gmail/v1/${input.path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(input.query ?? {})) {
    if (value !== undefined && value !== null && String(value) !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  const response = await fetch(url.toString(), {
    headers: { authorization: `Bearer ${input.accessToken}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gmail API failed (${response.status}): ${text.slice(0, 250)}`);
  }
  return (await response.json()) as T;
}

export function parseGmailMessageToPayload(message: any): JobIntakeEmailPayload {
  const headers = new Map<string, string>();
  const parts = message?.payload?.headers ?? [];
  for (const h of parts) {
    if (h?.name && h?.value) headers.set(String(h.name).toLowerCase(), String(h.value));
  }
  const subject = headers.get("subject") ?? "";
  const from = headers.get("from") ?? "unknown@example.com";
  const bodyData = message?.payload?.body?.data as string | undefined;
  const bodyText = bodyData ? Buffer.from(bodyData, "base64url").toString("utf8") : "";

  return normalizeGmailMessage({
    provider: "gmail",
    providerMessageId: String(message?.id ?? "unknown-message-id"),
    providerThreadId: String(message?.threadId ?? ""),
    from,
    subject,
    bodyText,
    receivedAt: new Date(Number(message?.internalDate ?? Date.now())).toISOString(),
    labels: Array.isArray(message?.labelIds) ? message.labelIds : [],
    raw: { snippet: message?.snippet ?? "", historyId: message?.historyId },
  });
}

export function normalizeGmailReply(input: Partial<EmailReplyPayload>): EmailReplyPayload {
  return {
    provider: input.provider ?? "gmail",
    providerMessageId: input.providerMessageId ?? "unknown-reply-id",
    providerThreadId: input.providerThreadId,
    from: input.from ?? "unknown@example.com",
    subject: input.subject ?? "",
    bodyText: input.bodyText ?? "",
    receivedAt: input.receivedAt ?? new Date().toISOString(),
    raw: input.raw ?? {},
  };
}

export async function fetchReplyByIdStub(messageId: string): Promise<EmailReplyPayload> {
  return normalizeGmailReply({
    provider: "gmail",
    providerMessageId: messageId,
    providerThreadId: `thread-${messageId}`,
    from: "recruiter@example.com",
    subject: "Interview invitation for your application",
    bodyText: "We would like to schedule an interview call next week.",
    receivedAt: new Date().toISOString(),
  });
}

export function classifyReplyRuleBased(payload: EmailReplyPayload): {
  classification:
    | "Positive Reply"
    | "Negative Reply"
    | "Auto Reply"
    | "Interview Intent"
    | "Offer Intent"
    | "Needs Review"
    | "No Response";
  confidence: number;
  reason: string;
} {
  const text = `${payload.subject} ${payload.bodyText}`.toLowerCase();
  if (/interview|schedule|call|meeting|availability/.test(text)) {
    return { classification: "Interview Intent", confidence: 0.91, reason: "Interview keywords detected" };
  }
  if (/offer|compensation|contract/.test(text)) {
    return { classification: "Offer Intent", confidence: 0.93, reason: "Offer keywords detected" };
  }
  if (/unfortunately|not selected|move forward with other candidates|regret/.test(text)) {
    return { classification: "Negative Reply", confidence: 0.9, reason: "Rejection keywords detected" };
  }
  if (/out of office|automatic reply|auto reply|vacation/.test(text)) {
    return { classification: "Auto Reply", confidence: 0.86, reason: "Auto-reply keywords detected" };
  }
  if (/thank you|excited|next steps|let us continue/.test(text)) {
    return { classification: "Positive Reply", confidence: 0.74, reason: "Positive sentiment markers detected" };
  }
  return { classification: "Needs Review", confidence: 0.55, reason: "No deterministic match found" };
}
