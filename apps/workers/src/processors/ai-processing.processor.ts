export type AiProcessingMode = "research" | "draft" | "full";

export type AiProcessingProcessorPayload = {
  tenantId: string;
  jobId: string;
  userId: string;
  mode: AiProcessingMode;
  correlationId?: string;
};

export async function processAiProcessingJob(payload: AiProcessingProcessorPayload) {
  // Stub implementation: AI processing (research, draft, full) is queued but not yet processed by workers
  // This will be implemented with actual LLM service calls in a future release
  return {
    queued: true,
    moduleKey: "ai-processing",
    status: "not-implemented",
    operationId: payload.correlationId || `ai-processing-${Date.now()}`,
    message: `AI processing (${payload.mode}) queued. Worker implementation pending.`,
    payload,
  };
}
