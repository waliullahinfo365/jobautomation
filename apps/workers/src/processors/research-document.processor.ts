export type ResearchDocumentProcessorPayload = {
  tenantId: string;
  jobId: string;
  userId: string;
  mode: "research" | "draft";
  correlationId?: string;
};

export async function processResearchGenerationJob(payload: ResearchDocumentProcessorPayload) {
  // Stub implementation: research document generation is queued but not yet processed by workers
  // This will be implemented with actual LLM/API calls in a future release
  return {
    queued: true,
    moduleKey: "research-document",
    status: "not-implemented",
    operationId: payload.correlationId || `research-document-${Date.now()}`,
    message: "Research document generation queued. Worker implementation pending.",
    payload,
  };
}

export async function processDraftGenerationJob(payload: ResearchDocumentProcessorPayload) {
  // TODO: Replace with BullMQ/Redis processor and call API service endpoint.
  return {
    queued: true,
    moduleKey: "ai-processing",
    operationId: `draft-generation-${Date.now()}`,
    payload,
  };
}
