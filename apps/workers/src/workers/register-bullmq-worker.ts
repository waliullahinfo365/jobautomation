import type { AutomationJobName, AutomationJobPayload } from "@jobflow/shared/types/queue";
import { processAutomationJob } from "./bullmq-worker";
import { logger } from "../utils/logger";
import { AUTOMATION_QUEUE_NAME } from "../queues/constants";
import { getErrorCode, redactForLog, relatedRecordIdFromPayload, serializeWorkerError } from "../utils/worker-error";

let bullmqWorker: { add: (pattern: string | symbol, fn: (job: unknown) => Promise<unknown>) => void } | null = null;

function getRedisUrlDiagnostics(): {
  protocol: "redis" | "rediss" | "unknown";
  hostPresent: boolean;
  portPresent: boolean;
  queueName: string;
} {
  const raw = process.env.REDIS_URL;
  if (!raw || !raw.trim()) {
    return {
      protocol: "unknown",
      hostPresent: false,
      portPresent: false,
      queueName: AUTOMATION_QUEUE_NAME,
    };
  }
  try {
    const u = new URL(raw);
    const protocol =
      u.protocol === "redis:"
        ? "redis"
        : u.protocol === "rediss:"
          ? "rediss"
          : "unknown";
    return {
      protocol,
      hostPresent: Boolean(u.hostname),
      portPresent: Boolean(u.port),
      queueName: AUTOMATION_QUEUE_NAME,
    };
  } catch {
    return {
      protocol: "unknown",
      hostPresent: false,
      portPresent: false,
      queueName: AUTOMATION_QUEUE_NAME,
    };
  }
}

async function initializeBullMQWorker() {
  const queueMode = process.env.QUEUE_MODE;

  if (!process.env.REDIS_URL?.trim()) {
    if (queueMode === "bullmq") {
      throw new Error("Missing REDIS_URL for BullMQ worker");
    }
    logger.debug("REDIS_URL not set, skipping BullMQ worker initialization");
    return null;
  }

  try {
    const dynamicImport = new Function("p", "return import(p)") as (path: string) => Promise<any>;
    const bullmq = await dynamicImport("bullmq");
    const ioredis = await dynamicImport("ioredis");
    const connection = new ioredis.default(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    const worker = new bullmq.Worker(
      AUTOMATION_QUEUE_NAME,
      async (job: any) => {
        const name: AutomationJobName = job.name;
        const payload: AutomationJobPayload = job.data;

        logger.debug({ jobName: name, jobId: job.id, tenantId: payload.tenantId }, "BullMQ worker processing job");

        const relatedRecordId = relatedRecordIdFromPayload(payload);
        try {
          const result = await processAutomationJob(name, payload, { queueJobId: job.id });
          logger.debug({ jobName: name, jobId: job.id, status: "success" }, "BullMQ job completed");
          return result;
        } catch (error) {
          const ser = serializeWorkerError(error);
          logger.error(
            {
              err: error,
              name: ser.name,
              message: redactForLog(ser.message),
              stack: ser.stack ? redactForLog(ser.stack, 4000) : undefined,
              code: ser.code,
              cause: ser.cause ? redactForLog(ser.cause) : undefined,
              jobName: name,
              jobId: job.id,
              tenantId: payload.tenantId,
              relatedRecordId,
              operationId: payload.operationId,
            },
            "BullMQ job failed"
          );
          throw error;
        }
      },
      { connection }
    );

    worker.on("completed", (job: any) => {
      logger.info({ jobName: job.name, jobId: job.id }, "BullMQ job completed successfully");
    });

    worker.on("failed", (job: any, err: Error) => {
      const payload = job?.data as AutomationJobPayload | undefined;
      const ser = serializeWorkerError(err);
      logger.error(
        {
          err,
          name: ser.name,
          message: redactForLog(ser.message),
          stack: ser.stack ? redactForLog(ser.stack, 4000) : undefined,
          code: ser.code,
          cause: ser.cause ? redactForLog(ser.cause) : undefined,
          jobName: job?.name,
          jobId: job?.id,
          tenantId: payload?.tenantId,
          relatedRecordId: payload ? relatedRecordIdFromPayload(payload) : undefined,
          operationId: payload?.operationId,
        },
        "BullMQ job failed (worker event)"
      );
    });

    logger.info({ queueName: AUTOMATION_QUEUE_NAME }, "BullMQ worker initialized");
    return worker;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(
      {
        err: error,
        message: err.message,
        name: err.name,
        stack: err.stack,
        code: getErrorCode(error),
        cause: err.cause,
        redis: getRedisUrlDiagnostics(),
      },
      "failed to initialize BullMQ worker"
    );

    if (queueMode === "bullmq") {
      throw error;
    }
    return null;
  }
}

export async function registerBullMQWorker() {
  bullmqWorker = await initializeBullMQWorker();
  return bullmqWorker;
}

export function getBullMQWorker() {
  return bullmqWorker;
}
