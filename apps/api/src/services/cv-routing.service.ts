import { randomUUID } from "node:crypto";
import { DocumentModel, JobModel } from "@jobflow/database/models";
import { processCvRoutingJob } from "@jobflow/workers/processors/cv-routing";
import type { CvRoutingResult } from "@jobflow/shared/types/document";
import { createAutomationLog } from "./automation-log.service";
import { assertTenantId, findTenantScopedById } from "./baseTenant.service";
import { provisionJobFolders } from "./folder-automation.service";
import { ApiError } from "../utils/errors";

type RouteCvInput = {
  tenantId: string;
  documentId: string;
  jobId: string;
  userId: string;
  operationId?: string;
};

export async function routeCvToJobFolder(input: RouteCvInput): Promise<CvRoutingResult> {
  const tenantId = assertTenantId(input.tenantId);
  const operationId = input.operationId ?? randomUUID();
  const idempotencyKey = `cv-routing:${tenantId}:${input.documentId}:${input.jobId}`;
  const [document, job] = await Promise.all([
    findTenantScopedById(DocumentModel, tenantId, input.documentId),
    findTenantScopedById(JobModel, tenantId, input.jobId),
  ]);

  if (!document) throw new ApiError("Document not found", 404, "NOT_FOUND");
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");

  const docRaw = document as unknown as Record<string, unknown>;
  const jobRaw = job as unknown as Record<string, unknown>;
  const isCvType = docRaw.type === "CV" || !docRaw.type;
  if (!isCvType) throw new ApiError("Document must be CV for route-cv", 422, "VALIDATION_ERROR");

  if (!jobRaw.driveFolderId || !jobRaw.folderCreated) {
    await provisionJobFolders({
      tenantId,
      jobId: input.jobId,
      userId: input.userId,
      operationId,
    });
  }

  const freshDoc = await findTenantScopedById(DocumentModel, tenantId, input.documentId);
  if (!freshDoc) throw new ApiError("Document not found after folder provisioning", 500, "AUTOMATION_ERROR");
  const freshDocument = freshDoc as unknown as Record<string, unknown> & { _id: unknown };

  if (freshDocument.routedToJobFolder && freshDocument.targetPath) {
    return {
      operationId,
      tenantId,
      documentId: input.documentId,
      jobId: input.jobId,
      status: "existing",
      targetPath: String(freshDocument.targetPath),
      message: "CV already routed to job folder",
    };
  }

  await DocumentModel.findByIdAndUpdate(freshDocument._id, { routingStatus: "Queued", routingError: undefined });

  try {
    await processCvRoutingJob({
      tenantId,
      documentId: input.documentId,
      jobId: input.jobId,
      userId: input.userId,
      operationId,
    });

    const routedDoc = await findTenantScopedById(DocumentModel, tenantId, input.documentId);
    const routed = routedDoc as unknown as Record<string, unknown> | null;
    return {
      operationId,
      tenantId,
      documentId: input.documentId,
      jobId: input.jobId,
      status: routed?.routingStatus === "Completed" ? "completed" : "pending",
      targetPath: routed?.targetPath ? String(routed.targetPath) : "",
      message: routed?.routingStatus === "Completed" ? "CV routed to job folder" : "CV routing pending — Drive not connected",
    };
  } catch (error) {
    await DocumentModel.findByIdAndUpdate(freshDocument._id, {
      routingStatus: "Failed",
      routingError: error instanceof Error ? error.message : "Unknown error",
    });
    await createAutomationLog({
      tenantId,
      moduleKey: "cv-routing",
      moduleName: "CV Routing",
      status: "Failed",
      message: "CV routing failed",
      relatedRecordType: "Document",
      relatedRecordId: input.documentId,
      operationId,
      idempotencyKey,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
