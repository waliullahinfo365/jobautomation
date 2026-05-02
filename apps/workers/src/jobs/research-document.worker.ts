import { processDraftGenerationJob as processDraftGenerationProcessorJob, processResearchGenerationJob as processResearchGenerationProcessorJob } from "../processors/research-document.processor";

export async function processResearchGenerationJob(input: {
  tenantId: string;
  jobId: string;
  userId: string;
  correlationId?: string;
}) {
  // TODO: wire to queue once BullMQ/Redis is introduced.
  return processResearchGenerationProcessorJob({ ...input, mode: "research" });
}

export async function processDraftGenerationJob(input: {
  tenantId: string;
  jobId: string;
  userId: string;
  correlationId?: string;
}) {
  // TODO: wire to queue once BullMQ/Redis is introduced.
  return processDraftGenerationProcessorJob({ ...input, mode: "draft" });
}
