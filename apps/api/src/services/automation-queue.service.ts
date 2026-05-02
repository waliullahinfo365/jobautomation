import { randomUUID } from "node:crypto";
import { enqueueAutomationJob as enqueueWorkerJob } from "@jobflow/workers/queue";
import type { AutomationJobName, AutomationJobPayload, AutomationQueueResult, BaseAutomationJobPayload } from "@shared/types/queue";
import { ApiError } from "../utils/errors";
import { logApiAction } from "./automation-log.service";
import { assertCanRunAutomation } from "./plan-limit.service";
import { incrementUsage } from "./usage.service";

type EnqueueInput = {
  tenantId: string;
  userId?: string;
  moduleKey: AutomationJobName;
  payload?: Record<string, unknown>;
  source?: BaseAutomationJobPayload["source"];
  operationId?: string;
};

function toDateKey(input = new Date()) {
  return input.toISOString().slice(0, 10);
}

function buildIdempotencyKey(moduleKey: AutomationJobName, tenantId: string, payload: Record<string, unknown>): string {
  switch (moduleKey) {
    case "job-intake":
      return `job-intake:${tenantId}:${String(payload.providerMessageId ?? "unknown-message")}`;
    case "duplicate-protection":
      return `duplicate-protection:${tenantId}:${String(payload.jobId ?? "unknown-job")}`;
    case "folder-automation":
      return `folder-automation:${tenantId}:${String(payload.jobId ?? "unknown-job")}`;
    case "applied-status":
      return `applied-status:${tenantId}:${String(payload.applicationId ?? "unknown-application")}`;
    case "interview-scheduling":
      return `interview-scheduling:${tenantId}:${String(payload.interviewId ?? "unknown-interview")}`;
    case "cv-routing":
      return `cv-routing:${tenantId}:${String(payload.documentId ?? "unknown-document")}:${String(payload.jobId ?? "unknown-job")}`;
    case "email-reply-detection":
      return `email-reply-detection:${tenantId}:${String(payload.providerMessageId ?? "unknown-message")}`;
    case "follow-up-reminder":
      return `follow-up-reminder:${tenantId}:${String(payload.applicationId ?? payload.date ?? toDateKey())}`;
    case "pdf-export":
      return `pdf-export:${tenantId}:${String(payload.documentId ?? "unknown-document")}`;
    case "research-document":
      return `research-document:${tenantId}:${String(payload.jobId ?? "unknown-job")}`;
    case "ai-processing":
      return `ai-processing:${tenantId}:${String(payload.jobId ?? "unknown-job")}:${String(payload.mode ?? "full")}`;
    case "daily-digest":
      return `daily-digest:${tenantId}:${String(payload.date ?? toDateKey())}`;
    case "weekly-report":
      return `weekly-report:${tenantId}:${String(payload.weekStart ?? "auto-start")}:${String(payload.weekEnd ?? "auto-end")}`;
    case "network-follow-up":
    case "offer-tracking":
    case "deadline-alert":
    case "lifecycle-monitoring":
      return `${moduleKey}:${tenantId}:${String(payload.date ?? toDateKey())}`;
    default:
      return `${moduleKey}:${tenantId}:${randomUUID()}`;
  }
}

export async function enqueueAutomationModule(input: EnqueueInput): Promise<AutomationQueueResult> {
  const operationId = input.operationId ?? randomUUID();
  const payload = input.payload ?? {};
  const idempotencyKey = buildIdempotencyKey(input.moduleKey, input.tenantId, payload);
  const queuePayload: AutomationJobPayload = {
    tenantId: input.tenantId,
    userId: input.userId ?? "system",
    operationId,
    correlationId: typeof payload.correlationId === "string" ? payload.correlationId : undefined,
    idempotencyKey,
    requestedAt: new Date().toISOString(),
    source: input.source ?? "api",
    ...(payload as Record<string, unknown>),
  } as AutomationJobPayload;

  try {
    await assertCanRunAutomation(input.tenantId);
    const result = await enqueueWorkerJob({
      name: input.moduleKey,
      payload: queuePayload,
    });
    if (result.status === "queued" || result.status === "scheduled") {
      await incrementUsage({ tenantId: input.tenantId, metric: "automationRunsThisMonth", amount: 1 });
    }
    await logApiAction({
      tenantId: input.tenantId,
      moduleKey: input.moduleKey,
      status: "Running",
      message: "Automation job queued via API queue facade",
      operationId,
      idempotencyKey,
      metadata: {
        source: queuePayload.source,
        queueResult: result,
      },
    });
    return result;
  } catch (error) {
    throw new ApiError(`Failed to enqueue module ${input.moduleKey}: ${error instanceof Error ? error.message : "Unknown error"}`, 500, "QUEUE_ERROR");
  }
}
