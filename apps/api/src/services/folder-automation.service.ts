import { randomUUID } from "node:crypto";
import { DocumentModel, JobModel } from "@jobflow/database/models";
import { createJobFolderTreeStub } from "@jobflow/integrations/google-drive/drive.service";
import type { FolderProvisionResult } from "@jobflow/shared/types/job";
import { createAutomationLog } from "./automation-log.service";
import { assertTenantId, findTenantScopedById } from "./baseTenant.service";
import { ApiError } from "../utils/errors";

type ProvisionInput = {
  tenantId: string;
  jobId: string;
  userId: string;
  operationId?: string;
};

export async function provisionJobFolders(input: ProvisionInput): Promise<FolderProvisionResult> {
  const tenantId = assertTenantId(input.tenantId);
  const operationId = input.operationId ?? randomUUID();
  const idempotencyKey = `folder-automation:${tenantId}:${input.jobId}`;
  const job = await findTenantScopedById(JobModel, tenantId, input.jobId);
  if (!job) throw new ApiError("Job not found", 404, "NOT_FOUND");

  if (job.folderCreated && job.driveFolderId) {
    return {
      operationId,
      tenantId,
      jobId: input.jobId,
      status: "existing",
      folderId: job.driveFolderId,
      folderUrl: job.driveFolderUrl,
      foldersCreated: ["CV", "Cover Letters", "Research", "Exports"],
      message: "Job folders already provisioned",
    };
  }

  await JobModel.findByIdAndUpdate(job._id, { folderProvisionStatus: "Queued", folderProvisionError: undefined });

  try {
    const folderTree = await createJobFolderTreeStub({
      tenantId,
      jobId: input.jobId,
      company: job.company,
      position: job.position,
    });

    await JobModel.findByIdAndUpdate(job._id, {
      folderCreated: true,
      driveFolderId: folderTree.jobFolderId,
      driveFolderUrl: folderTree.jobFolderUrl,
      folderProvisionStatus: "Completed",
      folderProvisionedAt: new Date(),
      folderProvisionError: undefined,
    });

    const folderDocuments = [
      { fileName: "Job Folder", targetFolderId: folderTree.jobFolderId, targetPath: folderTree.jobFolderUrl },
      ...folderTree.foldersCreated.map((folder) => ({
        fileName: `${folder.name} Folder`,
        targetFolderId: folder.id,
        targetPath: folder.url,
      })),
    ];

    for (const item of folderDocuments) {
      await DocumentModel.updateOne(
        { tenantId, jobId: input.jobId, fileName: item.fileName, documentKind: "Other" },
        {
          $setOnInsert: {
            tenantId,
            createdBy: input.userId,
            jobId: input.jobId,
            type: "Other",
            status: "Ready",
            documentKind: "Other",
            routingStatus: "Completed",
            routedToJobFolder: true,
            routedAt: new Date(),
          },
          $set: {
            targetFolderId: item.targetFolderId,
            targetPath: item.targetPath,
          },
        },
        { upsert: true }
      );
    }

    await createAutomationLog({
      tenantId,
      moduleKey: "folder-automation",
      moduleName: "Folder Automation",
      status: "Success",
      message: "Job folder structure provisioned",
      relatedRecordType: "Job",
      relatedRecordId: input.jobId,
      operationId,
      idempotencyKey,
      metadata: {
        rootFolderId: folderTree.rootFolderId,
        jobFolderId: folderTree.jobFolderId,
        foldersCreated: folderTree.foldersCreated.map((folder) => folder.name),
      },
    });

    return {
      operationId,
      tenantId,
      jobId: input.jobId,
      status: "completed",
      folderId: folderTree.jobFolderId,
      folderUrl: folderTree.jobFolderUrl,
      foldersCreated: folderTree.foldersCreated.map((folder) => folder.name),
      message: "Job folders provisioned",
    };
  } catch (error) {
    await JobModel.findByIdAndUpdate(job._id, {
      folderProvisionStatus: "Failed",
      folderProvisionError: error instanceof Error ? error.message : "Unknown error",
    });
    await createAutomationLog({
      tenantId,
      moduleKey: "folder-automation",
      moduleName: "Folder Automation",
      status: "Failed",
      message: "Job folder provisioning failed",
      relatedRecordType: "Job",
      relatedRecordId: input.jobId,
      operationId,
      idempotencyKey,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
