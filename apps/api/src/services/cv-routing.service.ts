import { randomUUID } from "node:crypto";
import { DocumentModel, JobModel } from "@database/models";
import { routeFileToFolderStub } from "@integrations/google-drive/drive.service";
import type { CvRoutingResult } from "@shared/types/document";
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

  const isCvType = document.type === "CV" || !document.type;
  if (!isCvType) throw new ApiError("Document must be CV for route-cv", 422, "VALIDATION_ERROR");

  if (!job.driveFolderId || !job.folderCreated) {
    await provisionJobFolders({
      tenantId,
      jobId: input.jobId,
      userId: input.userId,
      operationId,
    });
  }

  const freshDocument = await findTenantScopedById(DocumentModel, tenantId, input.documentId);
  const freshJob = await findTenantScopedById(JobModel, tenantId, input.jobId);
  if (!freshDocument || !freshJob?.driveFolderId) throw new ApiError("Folder provisioning failed", 500, "AUTOMATION_ERROR");

  if (freshDocument.routedToJobFolder && freshDocument.targetPath) {
    return {
      operationId,
      tenantId,
      documentId: input.documentId,
      jobId: input.jobId,
      status: "existing",
      targetPath: freshDocument.targetPath,
      message: "CV already routed to job folder",
    };
  }

  await DocumentModel.findByIdAndUpdate(freshDocument._id, { routingStatus: "Queued", routingError: undefined });

  try {
    const routed = await routeFileToFolderStub({
      tenantId,
      jobId: input.jobId,
      documentId: input.documentId,
      sourceFileId: freshDocument.sourceFileId,
      fileName: freshDocument.fileName,
      targetFolderId: freshJob.driveFolderId,
    });

    await DocumentModel.findByIdAndUpdate(freshDocument._id, {
      routedToJobFolder: true,
      routedAt: new Date(routed.routedAt),
      sourceFileId: freshDocument.sourceFileId ?? freshDocument.googleDriveFileId ?? String(freshDocument._id),
      targetFolderId: routed.targetFolderId,
      targetPath: routed.targetPath,
      googleDriveFileId: routed.targetFileId,
      googleDriveFolderId: routed.targetFolderId,
      routingStatus: "Completed",
      routingError: undefined,
    });

    await createAutomationLog({
      tenantId,
      moduleKey: "cv-routing",
      moduleName: "CV Routing",
      status: "Success",
      message: "CV routed to job folder",
      relatedRecordType: "Document",
      relatedRecordId: input.documentId,
      operationId,
      idempotencyKey,
      metadata: { jobId: input.jobId, targetPath: routed.targetPath, targetFolderId: routed.targetFolderId },
    });

    return {
      operationId,
      tenantId,
      documentId: input.documentId,
      jobId: input.jobId,
      status: "completed",
      targetPath: routed.targetPath,
      message: "CV routed to job folder",
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
