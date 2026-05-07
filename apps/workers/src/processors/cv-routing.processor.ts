import { AutomationLogModel, DocumentModel, JobModel } from "@jobflow/database/models";
import { loadGoogleAccessToken } from "../lib/google-auth";
import { createGoogleDoc, ensureWorkspaceFolderStructure, findOrCreateFolder } from "../lib/google-drive";

export type CvRoutingPayload = {
  tenantId: string;
  documentId: string;
  jobId: string;
  userId: string;
  operationId?: string;
};

export async function processCvRoutingJob(payload: CvRoutingPayload) {
  const operationId = payload.operationId ?? `cv-routing-${Date.now()}`;
  const auth = await loadGoogleAccessToken({
    tenantId: payload.tenantId,
    provider: "Google Drive",
    requiredScopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  if (!auth.connected) {
    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "cv-routing",
      moduleName: "cv-routing",
      status: "Warning",
      message: `CV routing skipped: ${auth.reason ?? "Drive not connected"}`,
      operationId,
      relatedRecordType: "Job",
      relatedRecordId: payload.jobId,
    });
    return { suppressWorkerCompletionLog: true as const, moduleKey: "cv-routing", status: "completed", operationId };
  }
  const job = await JobModel.findOne({ tenantId: payload.tenantId, _id: payload.jobId }).lean();
  if (!job) throw new Error(`Job not found: ${payload.jobId}`);
  const workspace = await ensureWorkspaceFolderStructure({
    tenantId: payload.tenantId,
    accessToken: auth.accessToken,
  });
  const jobFolder = await findOrCreateFolder({
    accessToken: auth.accessToken,
    name: `${String((job as Record<string, unknown>).company ?? "Company")} ${String((job as Record<string, unknown>).position ?? "Position")}`,
    parentId: workspace.applications.folder.id,
  });
  const cvFolder = await findOrCreateFolder({
    accessToken: auth.accessToken,
    name: "CV",
    parentId: jobFolder.folder.id,
  });

  const sourceCv =
    (await DocumentModel.findOne({
      tenantId: payload.tenantId,
      type: "CV",
      status: { $in: ["Ready", "Draft"] },
      $or: [{ jobId: { $exists: false } }, { jobId: null }, { jobId: "" }],
    })
      .sort({ updatedAt: -1 })
      .lean()) as Record<string, unknown> | null;

  let createdDoc;
  if (!sourceCv) {
    createdDoc = await createGoogleDoc({
      accessToken: auth.accessToken,
      name: "CV routing pending - upload CV",
      content: "CV source missing; upload CV in Documents.",
      parentId: cvFolder.folder.id,
    });
    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "cv-routing",
      moduleName: "cv-routing",
      status: "Warning",
      message: "CV source missing; upload CV in Documents.",
      operationId,
      relatedRecordType: "Job",
      relatedRecordId: payload.jobId,
    });
  } else {
    createdDoc = await createGoogleDoc({
      accessToken: auth.accessToken,
      name: `CV - ${String((job as Record<string, unknown>).company ?? "Company")} - ${String((job as Record<string, unknown>).position ?? "Position")}`,
      content: String(sourceCv.contentText ?? "CV content not available in text form."),
      parentId: cvFolder.folder.id,
    });
  }
  await JobModel.findByIdAndUpdate(payload.jobId, {
    cvFolderId: cvFolder.folder.id,
    cvFolderLink: cvFolder.folder.webViewLink ?? `https://drive.google.com/drive/folders/${cvFolder.folder.id}`,
  });
  await DocumentModel.findByIdAndUpdate(payload.documentId, {
    routedToJobFolder: true,
    routingStatus: "Completed",
    routedAt: new Date(),
    targetFolderId: cvFolder.folder.id,
    storageUrl: createdDoc.webViewLink ?? `https://docs.google.com/document/d/${createdDoc.id}/edit`,
    googleDriveFileId: createdDoc.id,
  });
  return {
    suppressWorkerCompletionLog: true as const,
    moduleKey: "cv-routing",
    status: "completed",
    operationId,
  };
}
