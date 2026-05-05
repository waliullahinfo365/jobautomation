import { connectDatabase, disconnectDatabase } from "@jobflow/database";
import { validateWorkerEnv } from "./config/validate-env";
import { getWorkerHealth, setWorkersStarted } from "./health";
import { registerSchedulers } from "./schedulers";
import { registerQueues } from "./queues";
import { registerProcessors } from "./processors";
import { drainMemoryQueue, getQueueMode } from "./queues/automation.queue";
import { logger } from "./utils/logger";

let started = false;

export async function startWorkers() {
  if (started) return;
  await registerQueues();
  registerProcessors();
  registerSchedulers();
  started = true;
  setWorkersStarted(true);
  logger.info({ mode: getQueueMode() }, "workers started");
}

export async function stopWorkers() {
  started = false;
  setWorkersStarted(false);
  logger.info("workers stopped");
}

export async function runWorkerHealthCheck() {
  return getWorkerHealth();
}

export async function processMemoryQueueNow() {
  await drainMemoryQueue();
}

async function main() {
  logger.info("Starting JobFlow workers");
  logger.info({ queueMode: process.env.QUEUE_MODE }, "Worker queue mode loaded");
  validateWorkerEnv();
  await connectDatabase();
  await startWorkers();
}

function registerShutdown() {
  let exiting = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (exiting) return;
    exiting = true;
    logger.info({ signal }, "shutdown signal received");
    try {
      await stopWorkers();
    } catch (e) {
      logger.error(e, "error stopping workers");
    }
    try {
      await disconnectDatabase();
      logger.info("database disconnected");
    } catch (e) {
      logger.error(e, "error disconnecting database");
    }
    logger.info("worker process shutdown complete");
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

registerShutdown();
void main().catch((error) => {
  logger.error(
    {
      err: error,
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    },
    "workers failed to start"
  );
  process.exit(1);
});
