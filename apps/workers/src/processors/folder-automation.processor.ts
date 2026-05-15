import { AutomationLogModel, DocumentModel, JobModel } from "@jobflow/database/models";
import { loadGoogleAccessToken } from "../lib/google-auth";
import { ensureWorkspaceFolderStructure, findOrCreateFolder } from "../lib/google-drive";
import { notifyAutomationEvent } from "../lib/notifications";

export type FolderAutomationPayload = {
  tenantId: string;
  jobId: string;
  userId: string;
  operationId?: string;
};

export async function processFolderAutomationJob(payload: FolderAutomationPayload) {
  const operationId = payload.operationId ?? `folder-automation-${Date.now()}`;
  const started = Date.now();

  const job = await JobModel.findOne({ tenantId: payload.tenantId, _id: payload.jobId }).lean();
  if (!job) {
    throw new Error(`Job not found: ${payload.jobId}`);
  }

  const company = String((job as Record<string, unknown>).company ?? "Company");
  const position = String((job as Record<string, unknown>).position ?? "Position");
  const existingFolderId = String((job as Record<string, unknown>).driveFolderId ?? "");
  if ((job as Record<string, unknown>).folderCreated === true && existingFolderId) {
    return {
      suppressWorkerCompletionLog: true as const,
      moduleKey: "folder-automation",
      status: "completed",
      operationId,
      skippedExistingFolders: true,
      folderId: existingFolderId,
    };
  }
  const folderLabel = `Job Applications/Applications/${company} ${position}`;

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
        folderName: `${company} ${position}`,
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
        folderName: `${company} ${position}`,
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
      folderName: `${company} ${position}`,
    };
  }

  const workspace = await ensureWorkspaceFolderStructure({
    tenantId: payload.tenantId,
    accessToken: auth.accessToken,
  });
  const jobFolder = await findOrCreateFolder({
    accessToken: auth.accessToken,
    name: `${company} ${position}`,
    parentId: workspace.applications.folder.id,
  });
  const cvFolder = await findOrCreateFolder({
    accessToken: auth.accessToken,
    name: "CV",
    parentId: jobFolder.folder.id,
  });
  const coverLetterFolder = await findOrCreateFolder({
    accessToken: auth.accessToken,
    name: "Cover Letter",
    parentId: jobFolder.folder.id,
  });
  const researchFolder = await findOrCreateFolder({
    accessToken: auth.accessToken,
    name: "Research",
    parentId: jobFolder.folder.id,
  });
  const exportsFolder = await findOrCreateFolder({
    accessToken: auth.accessToken,
    name: "Exports",
    parentId: jobFolder.folder.id,
  });
  const applicationProofFolder = await findOrCreateFolder({
    accessToken: auth.accessToken,
    name: "Application Proof",
    parentId: jobFolder.folder.id,
  });

  await JobModel.findByIdAndUpdate(payload.jobId, {
    folderCreated: true,
    driveFolderId: jobFolder.folder.id,
    driveFolderUrl:
      jobFolder.folder.webViewLink ?? `https://drive.google.com/drive/folders/${jobFolder.folder.id}`,
    driveFolderLink:
      jobFolder.folder.webViewLink ?? `https://drive.google.com/drive/folders/${jobFolder.folder.id}`,
    cvFolderId: cvFolder.folder.id,
    coverLetterFolderId: coverLetterFolder.folder.id,
    researchFolderId: researchFolder.folder.id,
    applicationProofFolderId: applicationProofFolder.folder.id,
    interviewPrepFolderId: undefined,
    cvFolderLink: cvFolder.folder.webViewLink ?? `https://drive.google.com/drive/folders/${cvFolder.folder.id}`,
    coverLetterFolderLink:
      coverLetterFolder.folder.webViewLink ?? `https://drive.google.com/drive/folders/${coverLetterFolder.folder.id}`,
    researchFolderLink:
      researchFolder.folder.webViewLink ?? `https://drive.google.com/drive/folders/${researchFolder.folder.id}`,
    applicationProofFolderLink:
      applicationProofFolder.folder.webViewLink ??
      `https://drive.google.com/drive/folders/${applicationProofFolder.folder.id}`,
    interviewPrepFolderLink: undefined,
    folderProvisionStatus: "Completed",
    folderProvisionedAt: new Date(),
    folderProvisionError: undefined,
  });

  const folderDocuments = [
    {
      fileName: "Job Folder",
      targetFolderId: jobFolder.folder.id,
      targetPath: jobFolder.folder.webViewLink ?? "",
    },
  ];

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
          storageProvider: "Google Drive",
        },
        $set: {
          targetFolderId: item.targetFolderId,
          targetPath: item.targetPath,
          storageLocation: folderLabel,
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
      message: `${jobFolder.created ? "Created" : "Found existing"} Drive folder for ${company} — ${position}.`,
    operationId,
    relatedRecordType: "Job",
    relatedRecordId: payload.jobId,
    durationMs,
    metadata: {
      jobId: payload.jobId,
      rootFolderId: workspace.root.folder.id,
      applicationsFolderId: workspace.applications.folder.id,
      jobFolderUrl: jobFolder.folder.webViewLink ?? `https://drive.google.com/drive/folders/${jobFolder.folder.id}`,
      jobFolderId: jobFolder.folder.id,
      createdSubfolders: [
        { name: "CV", created: cvFolder.created },
        { name: "Cover Letter", created: coverLetterFolder.created },
        { name: "Research", created: researchFolder.created },
        { name: "Exports", created: exportsFolder.created },
        { name: "Application Proof", created: applicationProofFolder.created },
      ],
      skippedExistingFolders: !jobFolder.created,
      driveConnected: true,
      folderPath: folderLabel,
    },
  });
  await notifyAutomationEvent({
    tenantId: payload.tenantId,
    moduleKey: "folder-automation",
    event: "folder-created",
    message: `Drive folder ${jobFolder.created ? "created" : "ready"} for ${company} — ${position}\nFolder: ${jobFolder.folder.webViewLink ?? `https://drive.google.com/drive/folders/${jobFolder.folder.id}`}`,
    operationId,
    metadata: { jobId: payload.jobId, folderId: jobFolder.folder.id, folderPath: folderLabel },
  });

  return {
    suppressWorkerCompletionLog: true as const,
    moduleKey: "folder-automation",
    status: "completed",
    operationId,
    folderUrl:
      jobFolder.folder.webViewLink ?? `https://drive.google.com/drive/folders/${jobFolder.folder.id}`,
    folderId: jobFolder.folder.id,
  };
}
