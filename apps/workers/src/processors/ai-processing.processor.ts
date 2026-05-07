export type AiProcessingMode = "research" | "draft" | "full";

export type AiProcessingProcessorPayload = {
  tenantId: string;
  jobId: string;
  userId: string;
  mode: AiProcessingMode;
  operationId?: string;
  correlationId?: string;
};

import { AutomationLogModel, JobModel } from "@jobflow/database/models";
import { createAiAnalysisDocument, createCoverLetterDocument, createResearchDocument } from "./ai-document-generation";
import { notifyAutomationEvent } from "../lib/notifications";
import { redactForLog, serializeWorkerError } from "../utils/worker-error";

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
        logModuleKey: "ai-processing",
      });
    }

    const research = await createResearchDocument({
      tenantId: payload.tenantId,
      userId: payload.userId,
      jobId: payload.jobId,
      operationId,
    });

    const coverLetter = await createCoverLetterDocument({
      tenantId: payload.tenantId,
      userId: payload.userId,
      jobId: payload.jobId,
      operationId,
      logModuleKey: "ai-processing",
    });

    const analysis = await createAiAnalysisDocument({
      tenantId: payload.tenantId,
      userId: payload.userId,
      jobId: payload.jobId,
      operationId,
    });

    return {
      suppressWorkerCompletionLog: true as const,
      moduleKey: "ai-processing",
      status: "completed",
      operationId,
      jobId: payload.jobId,
      documentsCreated: [research.documentId, coverLetter.documentId, analysis.documentId],
      summary: "Research, cover letter, and AI analysis documents generated.",
    };
  } catch (error) {
    const ser = serializeWorkerError(error);
    const msg = redactForLog(ser.message);
    try {
      await JobModel.findByIdAndUpdate(payload.jobId, {
        aiProcessingStatus: "Failed",
        aiProcessingError: msg,
        aiProcessingCompletedAt: new Date(),
      });
    } catch {
      /* ignore secondary failure */
    }
    try {
      await AutomationLogModel.create({
        tenantId: payload.tenantId,
        createdBy: "system",
        moduleKey: "ai-processing",
        moduleName: "ai-processing",
        status: "Failed",
        message: `AI processing failed: ${msg}`,
        operationId,
        relatedRecordType: "Job",
        relatedRecordId: payload.jobId,
        error: msg,
        metadata: {
          source: "worker:ai-processing",
          mode: payload.mode,
          errorDetails: {
            name: ser.name,
            message: msg,
            code: ser.code,
            cause: ser.cause ? redactForLog(ser.cause) : undefined,
          },
        },
      });
      await notifyAutomationEvent({
        tenantId: payload.tenantId,
        moduleKey: "ai-processing",
        event: "automation-failure",
        message: `⚠️ Automation needs attention: ai-processing failed — ${msg}`,
        operationId,
        metadata: { jobId: payload.jobId },
      });
    } catch {
      /* ignore log persistence failure */
    }
    throw error;
  }
}
