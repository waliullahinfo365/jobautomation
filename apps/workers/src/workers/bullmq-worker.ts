import type { AutomationJobName, AutomationJobPayload } from "@jobflow/shared/types/queue";
import { AutomationLogModel } from "@jobflow/database/models";
import { dispatchAutomationJob } from "../processors/automation.dispatcher";
import { logger } from "../utils/logger";

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

export async function processAutomationJob(name: AutomationJobName, payload: AutomationJobPayload) {
  const startTime = Date.now();
  const { tenantId, operationId, idempotencyKey, source } = payload;

  logger.info(
    { jobName: name, tenantId, operationId, source },
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
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(
      { jobName: name, tenantId, operationId, error: errorMessage },
      "automation job failed"
    );

    await createWorkerLog({
      tenantId,
      moduleKey: name,
      operationId,
      idempotencyKey,
      status: "Failed",
      message: `${name} job failed during execution`,
      durationMs,
      error: errorMessage,
      metadata: { source },
    });

    throw error;
  }
}
