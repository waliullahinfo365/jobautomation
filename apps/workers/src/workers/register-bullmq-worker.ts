import type { AutomationJobName, AutomationJobPayload } from "@jobflow/shared/types/queue";
import { processAutomationJob } from "./bullmq-worker";
import { logger } from "../utils/logger";
import { AUTOMATION_QUEUE_NAME } from "../queues/constants";

let bullmqWorker: { add: (pattern: string | symbol, fn: (job: unknown) => Promise<unknown>) => void } | null = null;

async function initializeBullMQWorker() {
  if (!process.env.REDIS_URL) {
    logger.debug("REDIS_URL not set, skipping BullMQ worker initialization");
    return null;
  }

  try {
    const dynamicImport = new Function("p", "return import(p)") as (path: string) => Promise<any>;
    const bullmq = await dynamicImport("bullmq");
    const ioredis = await dynamicImport("ioredis");
    const connection = new ioredis.default(process.env.REDIS_URL);

    const worker = new bullmq.Worker(AUTOMATION_QUEUE_NAME, async (job: any) => {
      const name: AutomationJobName = job.name;
      const payload: AutomationJobPayload = job.data;

      logger.debug(
        { jobName: name, jobId: job.id, tenantId: payload.tenantId },
        "BullMQ worker processing job"
      );

      try {
        const result = await processAutomationJob(name, payload);
        logger.debug(
          { jobName: name, jobId: job.id, status: "success" },
          "BullMQ job completed"
        );
        return result;
      } catch (error) {
        logger.error(
          { jobName: name, jobId: job.id, error },
          "BullMQ job failed"
        );
        throw error;
      }
    }, { connection });

    worker.on("completed", (job: any) => {
      logger.info(
        { jobName: job.name, jobId: job.id },
        "BullMQ job completed successfully"
      );
    });

    worker.on("failed", (job: any, err: Error) => {
      logger.error(
        { jobName: job?.name, jobId: job?.id, error: err.message },
        "BullMQ job failed"
      );
    });

    logger.info({ queueName: AUTOMATION_QUEUE_NAME }, "BullMQ worker initialized");
    return worker;
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      "failed to initialize BullMQ worker"
    );
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
