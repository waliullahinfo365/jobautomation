import type { AutomationJobName, AutomationJobPayload } from "@jobflow/shared/types/queue";
import { AutomationLogModel } from "@jobflow/database/models";
import { dispatchAutomationJob } from "../processors/automation.dispatcher";
import { logger } from "../utils/logger";
import { redactForLog, relatedRecordIdFromPayload, serializeWorkerError } from "../utils/worker-error";

export async function createWorkerLog(input: {
  tenantId: string;
  moduleKey: AutomationJobName;
  operationId?: string;
  idempotencyKey?: string;
  status: "Success" | "Failed" | "Running";
  message: string;
  durationMs?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await AutomationLogModel.create({
      tenantId: input.tenantId,
      createdBy: "system",
      moduleKey: input.moduleKey,
      moduleName: input.moduleKey,
      status: input.status,
      message: input.message,
      operationId: input.operationId,
      idempotencyKey: input.idempotencyKey,
      durationMs: input.durationMs,
      error: input.error,
      metadata: input.metadata,
    });
  } catch (e) {
    logger.error({ error: e, input }, "failed to create worker log");
  }
}

export async function processAutomationJob(
  name: AutomationJobName,
  payload: AutomationJobPayload,
  opts?: { queueJobId?: string | number }
) {
  const startTime = Date.now();
  const { tenantId, operationId, idempotencyKey, source } = payload;
  const relatedRecordId = relatedRecordIdFromPayload(payload);
  const queueJobId = opts?.queueJobId;

  logger.info(
    { jobName: name, jobId: queueJobId, tenantId, operationId, relatedRecordId, source },
    "processing automation job"
  );

  try {
    const result = await dispatchAutomationJob(name, payload);
    const durationMs = Date.now() - startTime;

    // Log stub/not-implemented status
    if (result && typeof result === "object") {
      const resultObj = result as Record<string, unknown>;
      if (resultObj.status === "not-implemented") {
        await createWorkerLog({
          tenantId,
          moduleKey: name,
          operationId,
          idempotencyKey,
          status: "Running",
          message: `${name} processor stub - implementation queued. Job will execute when implementation is available.`,
          durationMs,
          metadata: { result: resultObj, queueMode: "stub" },
        });
        return result;
      }
      if (resultObj.suppressWorkerCompletionLog === true) {
        return result;
      }
    }

    await createWorkerLog({
      tenantId,
      moduleKey: name,
      operationId,
      idempotencyKey,
      status: "Success",
      message: `${name} job processed successfully`,
      durationMs,
      metadata: { result },
    });

    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const parts = serializeWorkerError(error);
    const errorMessage = redactForLog(parts.message);

    logger.error(
      {
        err: error,
        name: parts.name,
        message: errorMessage,
        stack: parts.stack ? redactForLog(parts.stack, 4000) : undefined,
        code: parts.code,
        cause: parts.cause ? redactForLog(parts.cause) : undefined,
        jobName: name,
        jobId: queueJobId,
        tenantId,
        relatedRecordId,
        operationId,
      },
      "automation job failed"
    );

    const failedMessage =
      name === "ai-processing" || name === "research-document" || (name as string) === "cover-letter"
        ? `AI processing failed: ${errorMessage}`
        : `${name} failed: ${errorMessage}`;

    await createWorkerLog({
      tenantId,
      moduleKey: name,
      operationId,
      idempotencyKey,
      status: "Failed",
      message: failedMessage,
      durationMs,
      error: errorMessage,
      metadata: {
        source,
        relatedRecordId,
        errorDetails: {
          name: parts.name,
          message: errorMessage,
          code: parts.code,
          cause: parts.cause ? redactForLog(parts.cause) : undefined,
        },
      },
    });

    throw error;
  }
}
