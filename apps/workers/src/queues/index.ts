export { drainMemoryQueue, enqueueAutomationJob, enqueueManyAutomationJobs, getQueueMode } from "./automation.queue";

export async function registerQueues() {
  // Import and register BullMQ worker if REDIS_URL is available
  const { registerBullMQWorker } = await import("../workers/register-bullmq-worker");
  await registerBullMQWorker();
}
