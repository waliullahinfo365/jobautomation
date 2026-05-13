import type { JobIntakeEmailPayload } from "@jobflow/shared/types/job";
import { AutomationLogModel, IntegrationConnectionModel, JobModel } from "@jobflow/database/models";
import { runAiExtraction } from "@jobflow/integrations/ai/ai.service";
import { createJobFingerprint } from "@jobflow/shared/utils/fingerprint";
import { checkDuplicateJobWorker } from "../lib/duplicate-job-check";
import { loadGoogleAccessToken } from "../lib/google-auth";
import { notifyAutomationEvent } from "../lib/notifications";
import { enqueueAutomationJob } from "../queues/automation.queue";

async function gmailApiJson<T>(input: {
  accessToken: string;
  path: string;
  query?: Record<string, string | number | undefined>;
}): Promise<T> {
  const url = new URL(`https://gmail.googleapis.com/gmail/v1/${input.path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(input.query ?? {})) {
    if (value !== undefined && value !== null && String(value) !== "") url.searchParams.set(key, String(value));
  }
  const response = await fetch(url.toString(), { headers: { authorization: `Bearer ${input.accessToken}` } });
  if (!response.ok) throw new Error(`Gmail API failed: ${response.status}`);
  return (await response.json()) as T;
}

function parseGmailMessageToPayload(message: any): JobIntakeEmailPayload {
  const headers = new Map<string, string>();
  for (const h of message?.payload?.headers ?? []) {
    headers.set(String(h.name).toLowerCase(), String(h.value));
  }
  const bodyText = extractTextFromGmailPayload(message?.payload);
  return {
    provider: "gmail",
    providerMessageId: String(message?.id ?? ""),
    providerThreadId: String(message?.threadId ?? ""),
    from: headers.get("from") ?? "unknown@example.com",
    subject: headers.get("subject") ?? "",
    bodyText: bodyText || String(message?.snippet ?? ""),
    receivedAt: new Date(Number(message?.internalDate ?? Date.now())).toISOString(),
    labels: Array.isArray(message?.labelIds) ? message.labelIds : [],
    raw: { historyId: message?.historyId, snippet: message?.snippet },
  };
}

function decodeGmailBody(data?: string): string {
  if (!data) return "";
  try {
    return Buffer.from(data, "base64url").toString("utf8");
  } catch {
    return "";
  }
}

function extractTextFromGmailPayload(payload: any): string {
  const mimeType = String(payload?.mimeType ?? "");
  const body = decodeGmailBody(payload?.body?.data);
  if (body && (mimeType.includes("text/plain") || !Array.isArray(payload?.parts))) return body;
  const parts = Array.isArray(payload?.parts) ? payload.parts : [];
  const textParts = parts.map(extractTextFromGmailPayload).filter(Boolean);
  return textParts.join("\n").trim();
}

function parseProcessedMessageIds(metadata: Record<string, unknown> | undefined): string[] {
  const raw = metadata?.processedMessageIds;
  return Array.isArray(raw) ? raw.map(String).filter(Boolean) : [];
}

function getGmailIntakeQuery(metadata: Record<string, unknown> | undefined): string {
  const configured = process.env.GMAIL_JOB_ALERT_QUERY || String(metadata?.jobIntakeQuery ?? "");
  return configured.trim() || 'label:"Job Alerts" OR subject:(job OR hiring OR opportunity OR interview)';
}

function getMessageHistoryId(message: any): number {
  const n = Number(message?.historyId ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export type JobIntakeProcessorPayload = {
  tenantId: string;
  userId: string;
  payload: JobIntakeEmailPayload;
  correlationId?: string;
};

export async function processJobIntakeProcessor(payload: JobIntakeProcessorPayload) {
  const operationId = `job-intake-${Date.now()}`;
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
      moduleKey: "job-intake",
      moduleName: "job-intake",
      status: "Warning",
      message: reconnectRequired
        ? "Google reconnect required: demo connection cannot call Google APIs."
        : `Gmail intake skipped: ${auth.reason ?? "Gmail not connected"}`,
      operationId,
      metadata: {
        reason: auth.reason,
        reconnectRequired,
        demoConnection: reconnectRequired,
        provider: "gmail",
      },
    });
    return { suppressWorkerCompletionLog: true as const, moduleKey: "job-intake", status: "completed", operationId };
  }

  const gmailConn = await IntegrationConnectionModel.findOne({ tenantId: payload.tenantId, provider: "Gmail" });
  const gmailMetadata = gmailConn?.metadata as Record<string, unknown> | undefined;
  const lastHistoryId = String(gmailMetadata?.lastHistoryId ?? "");
  const processedMessageIds = new Set(parseProcessedMessageIds(gmailMetadata));
  const query = getGmailIntakeQuery(gmailMetadata);
  const list = await gmailApiJson<{ messages?: Array<{ id: string; threadId: string }>; resultSizeEstimate?: number }>({
    accessToken: auth.accessToken,
    path: "users/me/messages",
    query: { q: query, maxResults: 20 },
  });
  const messages = list.messages ?? [];
  let createdCount = 0;
  let skippedCount = 0;
  let maxHistoryId = Number(lastHistoryId || 0);

  for (const msg of messages) {
    if (processedMessageIds.has(msg.id)) {
      skippedCount += 1;
      continue;
    }
    const message = await gmailApiJson<any>({
      accessToken: auth.accessToken,
      path: `users/me/messages/${msg.id}`,
      query: { format: "full" },
    });
    const messageHistoryId = getMessageHistoryId(message);
    if (messageHistoryId > maxHistoryId) maxHistoryId = messageHistoryId;
    if (lastHistoryId && messageHistoryId > 0 && messageHistoryId <= Number(lastHistoryId)) {
      processedMessageIds.add(msg.id);
      skippedCount += 1;
      continue;
    }
    const normalized = parseGmailMessageToPayload(message);
    const extraction = await runAiExtraction({
      payload: normalized,
      config: { provider: "Claude", model: "claude-3-5-sonnet-20241022", fallbackToStub: true },
    });
    const data = extraction.data;
    if (!data.company || !data.position) continue;
    const fingerprintHash = createJobFingerprint({
      tenantId: payload.tenantId,
      company: data.company,
      position: data.position,
      jobUrl: data.jobUrl,
    });
    const existing = await JobModel.findOne({
      tenantId: payload.tenantId,
      $or: [{ providerMessageId: normalized.providerMessageId }, { fingerprintHash }],
    }).select("_id");
    if (existing) {
      processedMessageIds.add(normalized.providerMessageId);
      skippedCount += 1;
      await AutomationLogModel.create({
        tenantId: payload.tenantId,
        createdBy: "system",
        moduleKey: "duplicate-protection",
        moduleName: "duplicate-protection",
        status: "Warning",
        message: "Duplicate job skipped during Gmail intake.",
        operationId,
        relatedRecordType: "Job",
        relatedRecordId: String(existing._id),
        metadata: { gmailMessageId: normalized.providerMessageId },
      });
      await notifyAutomationEvent({
        tenantId: payload.tenantId,
        moduleKey: "job-intake",
        event: "duplicate-skipped",
        message: `Duplicate job skipped: ${data.company} — ${data.position}`,
        operationId,
        metadata: { jobId: String(existing._id) },
      });
      continue;
    }
    const duplicate = await checkDuplicateJobWorker(payload.tenantId, data);
    if (duplicate.status === "Duplicate") {
      processedMessageIds.add(normalized.providerMessageId);
      skippedCount += 1;
      await notifyAutomationEvent({
        tenantId: payload.tenantId,
        moduleKey: "duplicate-protection",
        event: "duplicate-skipped",
        message: `Duplicate job skipped: ${data.company} — ${data.position}`,
        operationId,
        metadata: { duplicateOfJobId: duplicate.duplicateOfJobId },
      });
      continue;
    }

    const created = await JobModel.create({
      tenantId: payload.tenantId,
      createdBy: payload.userId,
      company: data.company,
      position: data.position,
      source: data.source || "gmail",
      status: "New",
      priority: "Medium",
      location: data.location,
      jobUrl: data.jobUrl,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      contactEmail: data.contactEmail,
      description: data.description,
      fingerprintHash,
      intakeSource: "gmail",
      providerMessageId: normalized.providerMessageId,
      providerThreadId: normalized.providerThreadId,
      extractedFromEmail: true,
      extractionConfidence: data.confidence,
    });
    createdCount += 1;
    processedMessageIds.add(normalized.providerMessageId);
    await notifyAutomationEvent({
      tenantId: payload.tenantId,
      moduleKey: "job-intake",
      event: "new-job-detected",
      message: `New job imported:\n${data.company} — ${data.position}\nSource: Gmail\nFolder: pending\nDraft: pending`,
      operationId,
      metadata: { jobId: String(created._id) },
    });

    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "job-intake",
      moduleName: "job-intake",
      status: "Success",
      message: `New job created from Gmail: ${data.company} — ${data.position}.`,
      operationId,
      relatedRecordType: "Job",
      relatedRecordId: String(created._id),
      metadata: { gmailMessageId: normalized.providerMessageId, source: data.source || "gmail" },
    });

    const downstreamModules = [
      { name: "duplicate-protection", payload: { jobId: String(created._id) }, delayMs: 0 },
      { name: "folder-automation", payload: { jobId: String(created._id) }, delayMs: 1_000 },
      { name: "research-document", payload: { jobId: String(created._id), mode: "research" }, delayMs: 2_000 },
      { name: "ai-processing", payload: { jobId: String(created._id), mode: "draft" }, delayMs: 3_000 },
    ] as const;
    for (const moduleConfig of downstreamModules) {
      await enqueueAutomationJob({
        name: moduleConfig.name,
        delayMs: moduleConfig.delayMs,
        payload: {
          tenantId: payload.tenantId,
          userId: payload.userId,
          operationId: `${moduleConfig.name}-${Date.now()}-${created._id}`,
          idempotencyKey: `${moduleConfig.name}:${payload.tenantId}:${created._id}`,
          requestedAt: new Date().toISOString(),
          source: "system",
          ...moduleConfig.payload,
        } as any,
      });
    }
  }

  if (gmailConn) {
    gmailConn.lastSyncAt = new Date();
    gmailConn.syncStatus = "OK";
    gmailConn.metadata = {
      ...(gmailConn.metadata as Record<string, unknown>),
      lastHistoryId: maxHistoryId ? String(maxHistoryId) : lastHistoryId,
      processedMessageIds: Array.from(processedMessageIds).slice(-500),
      jobIntakeQuery: query,
    };
    await gmailConn.save();
  }

  await AutomationLogModel.create({
    tenantId: payload.tenantId,
    createdBy: "system",
    moduleKey: "job-intake",
    moduleName: "job-intake",
    status: "Success",
    message: `Gmail intake processed ${messages.length} messages; created ${createdCount} jobs.`,
    operationId,
    metadata: { scannedMessages: messages.length, createdCount, skippedCount, query },
  });
  return { suppressWorkerCompletionLog: true as const, moduleKey: "job-intake", status: "completed", operationId, createdCount };
}
