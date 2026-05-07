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
import { notifyAutomationEvent } from "../lib/notifications";
import { redactForLog, serializeWorkerError } from "../utils/worker-error";

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
    const ser = serializeWorkerError(error);
    const msg = redactForLog(ser.message);
    try {
      await AutomationLogModel.create({
        tenantId: payload.tenantId,
        createdBy: "system",
        moduleKey: "research-document",
        moduleName: "research-document",
        status: "Failed",
        message: `AI processing failed: ${msg}`,
        operationId,
        relatedRecordType: "Job",
        relatedRecordId: payload.jobId,
        error: msg,
        metadata: {
          source: "worker:research-document",
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
        moduleKey: "research-document",
        event: "automation-failure",
        message: `⚠️ Automation needs attention: research-document failed — ${msg}`,
        operationId,
        metadata: { jobId: payload.jobId },
      });
    } catch {
      /* ignore */
    }
    throw error;
  }
}

export async function processDraftGenerationJob(payload: ResearchDocumentProcessorPayload) {
  return processResearchGenerationJob({ ...payload, mode: "draft" });
}
