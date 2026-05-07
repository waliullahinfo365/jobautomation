import type { JobIntakeEmailPayload } from "@jobflow/shared/types/job";
import { AutomationLogModel, IntegrationConnectionModel, JobModel } from "@jobflow/database/models";
import { runAiExtraction } from "@jobflow/integrations/ai/ai.service";
import { createJobFingerprint } from "@jobflow/shared/utils/fingerprint";
import { checkDuplicateJobWorker } from "../lib/duplicate-job-check";
import { loadGoogleAccessToken } from "../lib/google-auth";
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
  const bodyData = message?.payload?.body?.data as string | undefined;
  return {
    provider: "gmail",
    providerMessageId: String(message?.id ?? ""),
    providerThreadId: String(message?.threadId ?? ""),
    from: headers.get("from") ?? "unknown@example.com",
    subject: headers.get("subject") ?? "",
    bodyText: bodyData ? Buffer.from(bodyData, "base64url").toString("utf8") : "",
    receivedAt: new Date(Number(message?.internalDate ?? Date.now())).toISOString(),
    labels: Array.isArray(message?.labelIds) ? message.labelIds : [],
    raw: { historyId: message?.historyId, snippet: message?.snippet },
  };
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
    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "job-intake",
      moduleName: "job-intake",
      status: "Warning",
      message: `Gmail intake skipped: ${auth.reason ?? "Gmail not connected"}`,
      operationId,
    });
    return { suppressWorkerCompletionLog: true as const, moduleKey: "job-intake", status: "completed", operationId };
  }

  const gmailConn = await IntegrationConnectionModel.findOne({ tenantId: payload.tenantId, provider: "Gmail" });
  const lastHistoryId = String((gmailConn?.metadata as Record<string, unknown> | undefined)?.lastHistoryId ?? "");
  const query =
    "label:job-alerts OR (job OR application OR recruiter OR opportunity OR hiring) newer_than:10d";
  const list = await gmailApiJson<{ messages?: Array<{ id: string; threadId: string }>; resultSizeEstimate?: number }>({
    accessToken: auth.accessToken,
    path: "users/me/messages",
    query: { q: query, maxResults: 20 },
  });
  const messages = list.messages ?? [];
  let createdCount = 0;

  for (const msg of messages) {
    const message = await gmailApiJson<any>({
      accessToken: auth.accessToken,
      path: `users/me/messages/${msg.id}`,
      query: { format: "full" },
    });
    if (lastHistoryId && Number(message.historyId ?? 0) <= Number(lastHistoryId)) continue;
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
      continue;
    }
    const duplicate = await checkDuplicateJobWorker(payload.tenantId, data);
    if (duplicate.status === "Duplicate") continue;

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

    for (const moduleName of ["duplicate-protection", "research-document", "ai-processing", "folder-automation"] as const) {
      await enqueueAutomationJob({
        name: moduleName,
        payload: {
          tenantId: payload.tenantId,
          userId: payload.userId,
          operationId: `${moduleName}-${Date.now()}-${created._id}`,
          requestedAt: new Date().toISOString(),
          source: "system",
          ...(moduleName === "folder-automation" || moduleName === "duplicate-protection" || moduleName === "research-document" || moduleName === "ai-processing"
            ? { jobId: String(created._id) }
            : {}),
        } as any,
      });
    }
  }

  if (gmailConn) {
    gmailConn.lastSyncAt = new Date();
    gmailConn.syncStatus = "OK";
    gmailConn.metadata = {
      ...(gmailConn.metadata as Record<string, unknown>),
      lastHistoryId: String(Date.now()),
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
    metadata: { scannedMessages: messages.length, createdCount },
  });
  return { suppressWorkerCompletionLog: true as const, moduleKey: "job-intake", status: "completed", operationId, createdCount };
}
