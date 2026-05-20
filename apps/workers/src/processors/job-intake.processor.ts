import type { JobIntakeEmailPayload } from "@jobflow/shared/types/job";
import { AutomationLogModel, IntegrationConnectionModel, JobModel } from "@jobflow/database/models";
import { runAiExtraction, isRealJobOpportunity } from "@jobflow/integrations/ai/ai.service";
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
  // Support both names — GMAIL_JOB_QUERY (documented in .env.example) and
  // GMAIL_JOB_ALERT_QUERY (legacy name used in earlier releases)
  const configured =
    process.env.GMAIL_JOB_QUERY ||
    process.env.GMAIL_JOB_ALERT_QUERY ||
    String(metadata?.jobIntakeQuery ?? "");
  return configured.trim() || 'label:"Job Alerts" OR subject:(job OR hiring OR opportunity OR interview)';
}

/** Returns true when the query is pre-filtered enough to use the relaxed confidence threshold */
function isPreFilteredQuery(query: string): boolean {
  // A query is pre-filtered if it came from the env var, OR if it targets a specific label
  const hasLabel = /\blabel:/i.test(query);
  const envSet = Boolean(process.env.GMAIL_JOB_QUERY?.trim() || process.env.GMAIL_JOB_ALERT_QUERY?.trim());
  return envSet || hasLabel;
}

function buildBackfillQuery(input: { label?: string; days?: number; metadata?: Record<string, unknown> }) {
  // If a custom query is configured via env var, use it directly for backfill too
  const envQuery = (process.env.GMAIL_JOB_QUERY || process.env.GMAIL_JOB_ALERT_QUERY)?.trim();
  if (envQuery) return envQuery;
  const days = Math.max(1, Math.min(30, Number(input.days ?? 7) || 7));
  const label = String(input.label || "job alerts").trim();
  const safeLabel = label.replace(/"/g, "");
  if (safeLabel) return `newer_than:${days}d label:"${safeLabel}"`;
  return `newer_than:${days}d ("job alert" OR job OR hiring OR application)`;
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
  label?: string;
  days?: number;
  dryRun?: boolean;
  enqueueDownstream?: boolean;
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
  const isBackfill = Boolean(payload.days || payload.label || payload.dryRun);
  const query = isBackfill
    ? buildBackfillQuery({ label: payload.label, days: payload.days, metadata: gmailMetadata })
    : getGmailIntakeQuery(gmailMetadata);
  const list = await gmailApiJson<{ messages?: Array<{ id: string; threadId: string }>; resultSizeEstimate?: number }>({
    accessToken: auth.accessToken,
    path: "users/me/messages",
    query: { q: query, maxResults: 20 },
  });
  const messages = list.messages ?? [];
  let createdCount = 0;
  let nonJobSkipped = 0;
  let duplicateSkipped = 0;
  let alreadyProcessed = 0;
  let validCount = 0;
  const preview: Array<{ messageId: string; company?: string; position?: string; subject?: string; from?: string }> = [];
  let maxHistoryId = Number(lastHistoryId || 0);

  for (const msg of messages) {
    if (!isBackfill && processedMessageIds.has(msg.id)) {
      alreadyProcessed += 1;
      continue;
    }
    const message = await gmailApiJson<any>({
      accessToken: auth.accessToken,
      path: `users/me/messages/${msg.id}`,
      query: { format: "full" },
    });
    const messageHistoryId = getMessageHistoryId(message);
    if (messageHistoryId > maxHistoryId) maxHistoryId = messageHistoryId;
    if (!isBackfill && lastHistoryId && messageHistoryId > 0 && messageHistoryId <= Number(lastHistoryId)) {
      processedMessageIds.add(msg.id);
      alreadyProcessed += 1;
      continue;
    }
    const normalized = parseGmailMessageToPayload(message);

    // Skip demo/test sender domains — never create production jobs from synthetic emails
    if (/jobs\.demo\.jobflow\.ai|@test\.|@example\./i.test(normalized.from)) {
      processedMessageIds.add(normalized.providerMessageId);
      nonJobSkipped += 1;
      continue;
    }

    // Classify before extraction — skip non-job emails early
    const classification = isRealJobOpportunity(normalized);
    // When the query targets a specific label (or came from an env var), the inbox is
    // already pre-filtered — use the relaxed 0.35 threshold. The strict 0.85 is only
    // for the generic "whole inbox" fallback query.
    const envThreshold = process.env.JOB_INTAKE_MIN_CONFIDENCE ? Number(process.env.JOB_INTAKE_MIN_CONFIDENCE) : null;
    const CONFIDENCE_THRESHOLD = envThreshold ?? (isPreFilteredQuery(query) ? 0.35 : 0.85);
    if (!classification.isJob || classification.confidence < CONFIDENCE_THRESHOLD) {
      processedMessageIds.add(normalized.providerMessageId);
      nonJobSkipped += 1;
      if (!payload.dryRun) {
        await AutomationLogModel.create({
          tenantId: payload.tenantId,
          createdBy: "system",
          moduleKey: "job-intake",
          moduleName: "job-intake",
          status: "Warning",
          message: `Email skipped (${classification.detectedType}): ${normalized.subject || "(no subject)"}`,
          operationId,
          metadata: {
            gmailMessageId: normalized.providerMessageId,
            from: normalized.from,
            subject: normalized.subject,
            detectedType: classification.detectedType,
            classificationConfidence: classification.confidence,
            classificationReason: classification.reason,
          },
        });
      }
      continue;
    }

    const extraction = await runAiExtraction({
      payload: normalized,
      config: { provider: "Claude", model: "claude-3-5-sonnet-latest", fallbackToStub: false },
    });
    const data = extraction.data;
    const UNKNOWN_COMPANY = !data.company || data.company === "Unknown Company";
    const UNKNOWN_POSITION = !data.position || data.position === "Unknown Position";
    if (UNKNOWN_COMPANY || UNKNOWN_POSITION) {
      nonJobSkipped += 1;
      processedMessageIds.add(normalized.providerMessageId);
      if (!payload.dryRun) {
        await AutomationLogModel.create({
          tenantId: payload.tenantId,
          createdBy: "system",
          moduleKey: "job-intake",
          moduleName: "job-intake",
          status: "Warning",
          message: `Email skipped (extraction failed — no company/position): ${normalized.subject || "(no subject)"}`,
          operationId,
          metadata: {
            gmailMessageId: normalized.providerMessageId,
            from: normalized.from,
            subject: normalized.subject,
            extractedCompany: data.company,
            extractedPosition: data.position,
            usedStub: extraction.usedStub,
          },
        });
      }
      continue;
    }
    validCount += 1;
    if (payload.dryRun) {
      preview.push({
        messageId: normalized.providerMessageId,
        company: data.company,
        position: data.position,
        subject: normalized.subject,
        from: normalized.from,
      });
      continue;
    }
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
      duplicateSkipped += 1;
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
      duplicateSkipped += 1;
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
      jobIntakeClassification: {
        isJobOpportunity: classification.isJob,
        confidence: classification.confidence,
        reason: classification.reason,
        emailType: classification.detectedType,
      },
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
    if (payload.enqueueDownstream !== false) {
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
  }

  if (gmailConn && !payload.dryRun) {
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

  const totalSkipped = nonJobSkipped + duplicateSkipped + alreadyProcessed;
  await AutomationLogModel.create({
    tenantId: payload.tenantId,
    createdBy: "system",
    moduleKey: "job-intake",
    moduleName: "job-intake",
    status: "Success",
    message: `Gmail intake: scanned ${messages.length}, created ${createdCount}, non-job skipped ${nonJobSkipped}, duplicates skipped ${duplicateSkipped}, already processed ${alreadyProcessed}.`,
    operationId,
    metadata: {
      scannedMessages: messages.length,
      createdCount,
      nonJobSkipped,
      duplicateSkipped,
      alreadyProcessed,
      totalSkipped,
      query,
    },
  });
  return {
    suppressWorkerCompletionLog: true as const,
    moduleKey: "job-intake",
    status: "completed",
    operationId,
    dryRun: Boolean(payload.dryRun),
    scannedMessages: messages.length,
    validCount,
    createdCount,
    nonJobSkipped,
    duplicateSkipped,
    alreadyProcessed,
    query,
    preview,
  };
}
