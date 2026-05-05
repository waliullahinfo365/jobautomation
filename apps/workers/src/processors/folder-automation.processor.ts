import { AutomationLogModel, DocumentModel, IntegrationConnectionModel, JobModel } from "@jobflow/database/models";

export type FolderAutomationPayload = {
  tenantId: string;
  jobId: string;
  userId: string;
  operationId?: string;
};

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function deterministicId(prefix: string, parts: string[]): string {
  return `${prefix}-${parts.map(slugify).filter(Boolean).join("-")}`;
}

function createJobFolderTreeStub(input: { tenantId: string; jobId: string; company: string; position: string }) {
  const rootFolderId = deterministicId("drv-root", [input.tenantId]);
  const jobFolderId = deterministicId("drv-job", [input.tenantId, input.jobId, input.company, input.position]);
  const folderNames = ["CV", "Cover Letters", "Research", "Exports"];

  return {
    rootFolderId,
    jobFolderId,
    jobFolderUrl: `https://drive.stub.local/folders/${jobFolderId}`,
    foldersCreated: folderNames.map((name) => ({
      id: deterministicId("drv-sub", [jobFolderId, name]),
      name,
      url: `https://drive.stub.local/folders/${deterministicId("drv-sub", [jobFolderId, name])}`,
    })),
  };
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

  const driveConn = await IntegrationConnectionModel.findOne({
    tenantId: payload.tenantId,
    provider: "Google Drive",
  }).lean();

  const driveLive =
    driveConn &&
    (driveConn as Record<string, unknown>).status === "Connected" &&
    Boolean((driveConn as Record<string, unknown>).accessTokenEncrypted);

  if (!driveLive) {
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
      message: "Drive folder record created. Live Drive folder creation requires Google Drive integration.",
      operationId,
      relatedRecordType: "Job",
      relatedRecordId: payload.jobId,
      durationMs,
      metadata: { jobId: payload.jobId, folderName: `${company} - ${position}`, pendingDrive: true },
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

  const folderTree = createJobFolderTreeStub({
    tenantId: payload.tenantId,
    jobId: payload.jobId,
    company,
    position,
  });

  await JobModel.findByIdAndUpdate(payload.jobId, {
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
    message: "Job folder structure provisioned (integration connected; Drive API uses stub IDs until full API wiring).",
    operationId,
    relatedRecordType: "Job",
    relatedRecordId: payload.jobId,
    durationMs,
    metadata: {
      jobId: payload.jobId,
      jobFolderUrl: folderTree.jobFolderUrl,
      jobFolderId: folderTree.jobFolderId,
      driveConnected: true,
    },
  });

  return {
    suppressWorkerCompletionLog: true as const,
    moduleKey: "folder-automation",
    status: "completed",
    operationId,
    folderUrl: folderTree.jobFolderUrl,
    folderId: folderTree.jobFolderId,
  };
}
