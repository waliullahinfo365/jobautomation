export type AiProcessingMode = "research" | "draft" | "full";

export type AiProcessingProcessorPayload = {
  tenantId: string;
  jobId: string;
  userId: string;
  mode: AiProcessingMode;
  operationId?: string;
  correlationId?: string;
};

import { AutomationLogModel } from "@jobflow/database/models";
import { createCoverLetterDocument, createResearchDocument } from "./ai-document-generation";

export async function processAiProcessingJob(payload: AiProcessingProcessorPayload) {
  const operationId = payload.operationId ?? payload.correlationId ?? `ai-processing-${Date.now()}`;
  try {
    if (payload.mode === "research") {
      return await createResearchDocument({
        tenantId: payload.tenantId,
        userId: payload.userId,
        jobId: payload.jobId,
        operationId,
      });
    }

    if (payload.mode === "draft") {
      return await createCoverLetterDocument({
        tenantId: payload.tenantId,
        userId: payload.userId,
        jobId: payload.jobId,
        operationId,
      });
    }

    const [research, coverLetter] = await Promise.all([
      createResearchDocument({
        tenantId: payload.tenantId,
        userId: payload.userId,
        jobId: payload.jobId,
        operationId,
      }),
      createCoverLetterDocument({
        tenantId: payload.tenantId,
        userId: payload.userId,
        jobId: payload.jobId,
        operationId,
      }),
    ]);

    return {
      moduleKey: "ai-processing",
      status: "completed",
      operationId,
      jobId: payload.jobId,
      documentsCreated: [research.documentId, coverLetter.documentId],
      summary: "Research and cover letter documents generated.",
    };
  } catch (error) {
    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "ai-processing",
      moduleName: "ai-processing",
      status: "Failed",
      message: `AI processing failed (${payload.mode}).`,
      operationId,
      relatedRecordType: "Job",
      relatedRecordId: payload.jobId,
      error: error instanceof Error ? error.message : String(error),
      metadata: { source: "worker:ai-processing", mode: payload.mode },
    });
    throw error;
  }
}
