import { randomUUID } from "node:crypto";
import { JobModel } from "@jobflow/database/models";
import { processFolderAutomationJob } from "@jobflow/workers/processors/folder-automation";
import type { FolderProvisionResult } from "@jobflow/shared/types/job";
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
      foldersCreated: ["CV", "Cover Letter", "Research", "Exports"],
      message: "Job folders already provisioned",
    };
  }

  await JobModel.findByIdAndUpdate(job._id, { folderProvisionStatus: "Queued", folderProvisionError: undefined });

  try {
    const result = await processFolderAutomationJob({
      tenantId,
      jobId: input.jobId,
      userId: input.userId,
      operationId,
    });

    return {
      operationId,
      tenantId,
      jobId: input.jobId,
      status: "completed",
      folderId: result.folderId,
      folderUrl: result.folderUrl,
      foldersCreated: ["CV", "Cover Letter", "Research", "Exports"],
      message: "Job folders provisioned",
    };
  } catch (error) {
    await JobModel.findByIdAndUpdate(job._id, {
      folderProvisionStatus: "Failed",
      folderProvisionError: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
