export type ResearchDocumentProcessorPayload = {
  tenantId: string;
  jobId: string;
  userId: string;
  mode: "research" | "draft";
  correlationId?: string;
};

export async function processResearchGenerationJob(payload: ResearchDocumentProcessorPayload) {
  // TODO: Replace with BullMQ/Redis processor and call API service endpoint.
  return {
    queued: true,
    moduleKey: "research-document",
    operationId: `research-document-${Date.now()}`,
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
