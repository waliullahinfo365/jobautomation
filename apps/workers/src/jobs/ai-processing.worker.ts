import { processAiProcessingJob } from "../processors/ai-processing.processor";

export async function processAiProcessingJobWorker(input: {
  tenantId: string;
  jobId: string;
  userId: string;
  mode: "research" | "draft" | "full";
  correlationId?: string;
}) {
  // TODO: wire to queue once BullMQ/Redis is introduced.
  return processAiProcessingJob(input);
}

export { processAiProcessingJob };
