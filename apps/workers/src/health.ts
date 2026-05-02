import { getDatabaseStatus } from "@jobflow/database";
import { getQueueMode } from "./queues/automation.queue";

let workersStarted = false;

export function setWorkersStarted(value: boolean): void {
  workersStarted = value;
}

export async function getWorkerHealth() {
  const db = getDatabaseStatus();
  return {
    success: true,
    service: "jobflow-workers",
    queueMode: getQueueMode(),
    uptimeSeconds: process.uptime(),
    schedulerEnabled: process.env.SCHEDULER_ENABLED === "true",
    started: workersStarted,
    database: {
      status: db.state,
    },
  };
}
