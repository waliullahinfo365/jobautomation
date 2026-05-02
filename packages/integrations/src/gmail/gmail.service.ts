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
