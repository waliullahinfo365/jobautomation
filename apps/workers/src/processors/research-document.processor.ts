export type ResearchDocumentProcessorPayload = {
  tenantId: string;
  jobId: string;
  userId: string;
  mode: "research" | "draft";
  operationId?: string;
  correlationId?: string;
};

import { AutomationLogModel } from "@jobflow/database/models";
import { createResearchDocument } from "./ai-document-generation";

export async function processResearchGenerationJob(payload: ResearchDocumentProcessorPayload) {
  const operationId = payload.operationId ?? payload.correlationId ?? `research-document-${Date.now()}`;
  try {
    return await createResearchDocument({
      tenantId: payload.tenantId,
      userId: payload.userId,
      jobId: payload.jobId,
      operationId,
    });
  } catch (error) {
    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "research-document",
      moduleName: "research-document",
      status: "Failed",
      message: "Research document generation failed.",
      operationId,
      relatedRecordType: "Job",
      relatedRecordId: payload.jobId,
      error: error instanceof Error ? error.message : String(error),
      metadata: { source: "worker:research-document" },
    });
    throw error;
  }
}

export async function processDraftGenerationJob(payload: ResearchDocumentProcessorPayload) {
  return processResearchGenerationJob({ ...payload, mode: "draft" });
}
