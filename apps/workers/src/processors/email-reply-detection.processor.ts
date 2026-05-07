import { ApplicationModel, AutomationLogModel, InterviewModel, JobModel } from "@jobflow/database/models";
import { loadGoogleAccessToken } from "../lib/google-auth";
import { notifyAutomationEvent } from "../lib/notifications";
import { enqueueAutomationJob } from "../queues/automation.queue";

function normalizeReply(input: {
  providerMessageId: string;
  providerThreadId?: string;
  from: string;
  subject: string;
  bodyText: string;
  receivedAt: string;
}) {
  return {
    provider: "gmail" as const,
    providerMessageId: input.providerMessageId,
    providerThreadId: input.providerThreadId,
    from: input.from,
    subject: input.subject,
    bodyText: input.bodyText,
    receivedAt: input.receivedAt,
  };
}

function classifyReplyRuleBased(payload: { subject: string; bodyText: string }) {
  const text = `${payload.subject} ${payload.bodyText}`.toLowerCase();
  if (/interview|schedule|call|meeting|availability/.test(text)) return { classification: "Interview Intent" as const };
  if (/offer|compensation|contract/.test(text)) return { classification: "Offer Intent" as const };
  if (/unfortunately|not selected|regret|other candidates/.test(text)) return { classification: "Negative Reply" as const };
  return { classification: "Needs Review" as const };
}

async function gmailApiJson<T>(input: { accessToken: string; path: string; query?: Record<string, string> }): Promise<T> {
  const url = new URL(`https://gmail.googleapis.com/gmail/v1/${input.path}`);
  for (const [k, v] of Object.entries(input.query ?? {})) url.searchParams.set(k, v);
  const response = await fetch(url.toString(), { headers: { authorization: `Bearer ${input.accessToken}` } });
  if (!response.ok) throw new Error(`Gmail API failed: ${response.status}`);
  return (await response.json()) as T;
}

export async function processEmailReplyDetectionJob(payload: {
  tenantId: string;
  providerMessageId: string;
  providerThreadId?: string;
  from: string;
  subject: string;
  bodyText: string;
  receivedAt: string;
  operationId?: string;
}) {
  const operationId = payload.operationId ?? `email-reply-detection-${Date.now()}`;
  const auth = await loadGoogleAccessToken({
    tenantId: payload.tenantId,
    provider: "Gmail",
    requiredScopes: ["https://www.googleapis.com/auth/gmail.readonly"],
  });
  if (!auth.connected) {
    const reconnectRequired = auth.reason === "Google reconnect required: demo connection cannot call Google APIs.";
    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "email-reply-detection",
      moduleName: "email-reply-detection",
      status: "Warning",
      message: reconnectRequired
        ? "Google reconnect required: demo connection cannot call Google APIs."
        : `Email reply detection skipped: ${auth.reason ?? "Gmail not connected"}`,
      operationId,
      metadata: {
        reason: auth.reason,
        reconnectRequired,
        demoConnection: reconnectRequired,
        provider: "gmail",
      },
    });
    return { suppressWorkerCompletionLog: true as const, moduleKey: "email-reply-detection", status: "completed", operationId };
  }

  const message = await gmailApiJson<any>({
    accessToken: auth.accessToken,
    path: `users/me/messages/${payload.providerMessageId}`,
    query: { format: "metadata" },
  });
  const headers = new Map<string, string>();
  for (const h of message?.payload?.headers ?? []) {
    headers.set(String(h.name).toLowerCase(), String(h.value));
  }
  const normalized = normalizeReply({
    providerMessageId: String(message.id),
    providerThreadId: String(message.threadId ?? payload.providerThreadId ?? ""),
    from: headers.get("from") ?? payload.from,
    subject: headers.get("subject") ?? payload.subject,
    bodyText: payload.bodyText,
    receivedAt: payload.receivedAt,
  });
  const classification = classifyReplyRuleBased(normalized);

  const app = await ApplicationModel.findOne({
    tenantId: payload.tenantId,
    $or: [{ providerThreadId: normalized.providerThreadId }, { lastProviderMessageId: normalized.providerMessageId }],
  }).sort({ updatedAt: -1 });
  if (!app) {
    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "email-reply-detection",
      moduleName: "email-reply-detection",
      status: "Warning",
      message: "No matching application found for Gmail reply.",
      operationId,
      metadata: { providerThreadId: normalized.providerThreadId },
    });
    return { suppressWorkerCompletionLog: true as const, moduleKey: "email-reply-detection", status: "completed", operationId, matched: false };
  }

  const update: Record<string, unknown> = {
    lastProviderMessageId: normalized.providerMessageId,
    providerThreadId: normalized.providerThreadId,
    responseDetected: true,
    replyDetectedAt: new Date(normalized.receivedAt),
    responseStatus: "Needs Review",
  };
  if (classification.classification === "Interview Intent") {
    update.applicationStatus = "Interview";
    update.responseStatus = "Positive Reply";
    const interview = await InterviewModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      jobId: app.jobId,
      applicationId: String(app._id),
      company: app.company,
      position: app.position,
      interviewType: "Final Round",
      status: "Scheduled",
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await enqueueAutomationJob({
      name: "interview-scheduling",
      payload: {
        tenantId: payload.tenantId,
        userId: "system",
        operationId: `interview-scheduling-${interview._id}`,
        requestedAt: new Date().toISOString(),
        source: "system",
        interviewId: String(interview._id),
      },
    });
  } else if (classification.classification === "Negative Reply") {
    update.applicationStatus = "Rejected";
    update.responseStatus = "Negative Reply";
    if (app.jobId) await JobModel.findByIdAndUpdate(app.jobId, { status: "Rejected" });
  } else if (classification.classification === "Offer Intent") {
    update.applicationStatus = "Offer";
    update.responseStatus = "Positive Reply";
    if (app.jobId) await JobModel.findByIdAndUpdate(app.jobId, { status: "Offer" });
    await notifyAutomationEvent({
      tenantId: payload.tenantId,
      moduleKey: "email-reply-detection",
      event: "offer-received",
      message: `🎉 Offer received: ${app.company} — ${app.position}`,
      operationId,
      metadata: { applicationId: String(app._id), jobId: String(app.jobId ?? "") },
    });
  }
  await ApplicationModel.findByIdAndUpdate(app._id, update);
  await AutomationLogModel.create({
    tenantId: payload.tenantId,
    createdBy: "system",
    moduleKey: "email-reply-detection",
    moduleName: "email-reply-detection",
    status: "Success",
    message: `Reply classified as ${classification.classification}.`,
    operationId,
    relatedRecordType: "Application",
    relatedRecordId: String(app._id),
  });
  return {
    suppressWorkerCompletionLog: true as const,
    moduleKey: "email-reply-detection",
    status: "completed",
    operationId,
    classification: classification.classification,
  };
}
