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
