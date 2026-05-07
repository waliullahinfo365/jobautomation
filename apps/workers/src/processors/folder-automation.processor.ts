import { AutomationLogModel, DocumentModel, JobModel } from "@jobflow/database/models";
import { googleApiJson, loadGoogleAccessToken } from "../lib/google-auth";

export type FolderAutomationPayload = {
  tenantId: string;
  jobId: string;
  userId: string;
  operationId?: string;
};

async function createDriveFolder(input: { accessToken: string; name: string; parentId?: string }) {
  return googleApiJson<{ id: string; webViewLink?: string }>({
    url: "https://www.googleapis.com/drive/v3/files?fields=id,webViewLink",
    method: "POST",
    accessToken: input.accessToken,
    body: {
      name: input.name,
      mimeType: "application/vnd.google-apps.folder",
      ...(input.parentId ? { parents: [input.parentId] } : {}),
    },
  });
}

export async function processFolderAutomationJob(payload: FolderAutomationPayload) {
  const operationId = payload.operationId ?? `folder-automation-${Date.now()}`;
  const started = Date.now();

  const job = await JobModel.findOne({ tenantId: payload.tenantId, _id: payload.jobId }).lean();
  if (!job) {
    throw new Error(`Job not found: ${payload.jobId}`);
  }

  const company = String((job as Record<string, unknown>).company ?? "Company");
  const position = String((job as Record<string, unknown>).position ?? "Position");
  const folderLabel = `JobFlow/${company} - ${position}`;

  const auth = await loadGoogleAccessToken({
    tenantId: payload.tenantId,
    provider: "Google Drive",
    requiredScopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  if (!auth.connected) {
    const reconnectRequired = auth.reason === "Google reconnect required: demo connection cannot call Google APIs.";
    await DocumentModel.create({
      tenantId: payload.tenantId,
      createdBy: payload.userId,
      jobId: payload.jobId,
      fileName: `Drive folder (pending): ${company} - ${position}`,
      type: "Other",
      status: "Draft",
      documentKind: "Other",
      generationStatus: "Pending",
      metadata: {
        folderName: `${company} - ${position}`,
        folderPath: folderLabel,
        status: "pending-drive-connection",
        operationId,
        source: "worker:folder-automation",
      },
    });

    await JobModel.findByIdAndUpdate(payload.jobId, {
      folderProvisionStatus: "Queued",
      folderProvisionError: "pending-drive-connection",
    });

    const durationMs = Date.now() - started;

    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "folder-automation",
      moduleName: "folder-automation",
      status: "Warning",
      message: reconnectRequired
        ? "Google reconnect required: demo connection cannot call Google APIs."
        : `Drive folder automation skipped: ${auth.reason ?? "Drive integration unavailable"}`,
      operationId,
      relatedRecordType: "Job",
      relatedRecordId: payload.jobId,
      durationMs,
      metadata: {
        jobId: payload.jobId,
        folderName: `${company} - ${position}`,
        pendingDrive: true,
        reason: auth.reason,
        reconnectRequired,
        demoConnection: reconnectRequired,
        provider: "google-drive",
      },
    });

    return {
      suppressWorkerCompletionLog: true as const,
      moduleKey: "folder-automation",
      status: "completed",
      operationId,
      pendingDriveConnection: true,
      folderName: `${company} - ${position}`,
    };
  }

  const root = await createDriveFolder({ accessToken: auth.accessToken, name: "Job Applications" });
  const appsFolder = await createDriveFolder({
    accessToken: auth.accessToken,
    name: "Applications",
    parentId: root.id,
  });
  const jobFolder = await createDriveFolder({
    accessToken: auth.accessToken,
    name: `${company} — ${position}`,
    parentId: appsFolder.id,
  });

  await JobModel.findByIdAndUpdate(payload.jobId, {
    folderCreated: true,
    driveFolderId: jobFolder.id,
    driveFolderUrl: jobFolder.webViewLink ?? `https://drive.google.com/drive/folders/${jobFolder.id}`,
    folderProvisionStatus: "Completed",
    folderProvisionedAt: new Date(),
    folderProvisionError: undefined,
  });

  const folderDocuments = [{ fileName: "Job Folder", targetFolderId: jobFolder.id, targetPath: jobFolder.webViewLink ?? "" }];

  for (const item of folderDocuments) {
    await DocumentModel.updateOne(
      { tenantId: payload.tenantId, jobId: payload.jobId, fileName: item.fileName, documentKind: "Other" },
      {
        $setOnInsert: {
          tenantId: payload.tenantId,
          createdBy: payload.userId,
          jobId: payload.jobId,
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

  const durationMs = Date.now() - started;

  await AutomationLogModel.create({
    tenantId: payload.tenantId,
    createdBy: "system",
    moduleKey: "folder-automation",
    moduleName: "folder-automation",
    status: "Success",
    message: "Job folder created in Google Drive.",
    operationId,
    relatedRecordType: "Job",
    relatedRecordId: payload.jobId,
    durationMs,
    metadata: {
      jobId: payload.jobId,
      jobFolderUrl: jobFolder.webViewLink ?? `https://drive.google.com/drive/folders/${jobFolder.id}`,
      jobFolderId: jobFolder.id,
      driveConnected: true,
    },
  });

  return {
    suppressWorkerCompletionLog: true as const,
    moduleKey: "folder-automation",
    status: "completed",
    operationId,
    folderUrl: jobFolder.webViewLink ?? `https://drive.google.com/drive/folders/${jobFolder.id}`,
    folderId: jobFolder.id,
  };
}
