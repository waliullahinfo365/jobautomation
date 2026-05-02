export { drainMemoryQueue, enqueueAutomationJob, enqueueManyAutomationJobs, getQueueMode } from "./automation.queue";

export async function registerQueues() {
  // TODO: initialize Redis/BullMQ queue clients for production mode.
}
