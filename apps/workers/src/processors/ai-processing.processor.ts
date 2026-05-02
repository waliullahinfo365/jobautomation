export type AiProcessingMode = "research" | "draft" | "full";

export type AiProcessingProcessorPayload = {
  tenantId: string;
  jobId: string;
  userId: string;
  mode: AiProcessingMode;
  correlationId?: string;
};

export async function processAiProcessingJob(payload: AiProcessingProcessorPayload) {
  // TODO: Replace with BullMQ/Redis processor and call API service endpoint.
  return {
    queued: true,
    moduleKey: "ai-processing",
    operationId: `ai-processing-${Date.now()}`,
    payload,
  };
}
