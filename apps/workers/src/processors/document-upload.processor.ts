import { AutomationLogModel, DocumentModel } from "@jobflow/database/models";
import { GOOGLE_DRIVE_DOCS_WORKER_SCOPES } from "@jobflow/shared/constants/googleScopes";
import { isGoogleDriveEnabled } from "@jobflow/shared/constants/legacy-integrations";
import { createGoogleDoc, ensureWorkspaceFolderStructure, findOrCreateFolder } from "../lib/google-drive";
import { loadGoogleAccessToken } from "../lib/google-auth";

type ProfileDocumentType = "cv_resume" | "cover_letter_template" | "supporting_document";

export type DocumentUploadProcessorPayload = {
  tenantId: string;
  userId: string;
  documentId: string;
  profileDocumentType: ProfileDocumentType;
  operationId?: string;
};

function driveLink(id: string) {
  return `https://docs.google.com/document/d/${id}/edit`;
}

function isFirebaseBacked(doc: { storageProvider?: string | null; storagePath?: string | null }) {
  const provider = String(doc.storageProvider ?? "").toLowerCase();
  if (provider === "firebase") return true;
  const path = String(doc.storagePath ?? "");
  return path.startsWith("tenants/");
}

async function activateProfileDocumentLocally(input: {
  tenantId: string;
  doc: { _id: unknown; metadata?: unknown };
  contentText: string;
  profileDocumentType: ProfileDocumentType;
  operationId: string;
  storageLocation: string;
  message: string;
  status: "Success" | "Warning";
}) {
  if (input.contentText && input.profileDocumentType !== "supporting_document") {
    await DocumentModel.updateMany(
      {
        tenantId: input.tenantId,
        profileDocumentType: input.profileDocumentType,
        _id: { $ne: input.doc._id },
      },
      { isActiveProfileDocument: false }
    );
    await DocumentModel.findByIdAndUpdate(input.doc._id, {
      status: "Ready",
      generationStatus: "Generated",
      extractionStatus: "Provided",
      extractionError: undefined,
      isActiveProfileDocument: true,
      storageLocation: input.storageLocation,
      storagePath: input.storageLocation,
      metadata: {
        ...((input.doc.metadata as Record<string, unknown> | undefined) ?? {}),
        workspaceLibrary: true,
        profileDocumentType: input.profileDocumentType,
        operationId: input.operationId,
      },
    });
  }

  await AutomationLogModel.create({
    tenantId: input.tenantId,
    createdBy: "system",
    moduleKey: "document-upload",
    moduleName: "document-upload",
    status: input.status,
    message: input.message,
    operationId: input.operationId,
    relatedRecordType: "Document",
    relatedRecordId: String(input.doc._id),
    metadata: { profileDocumentType: input.profileDocumentType },
  });

  return {
    suppressWorkerCompletionLog: true as const,
    moduleKey: "document-upload",
    status: input.status === "Success" ? ("completed" as const) : ("warning" as const),
    operationId: input.operationId,
  };
}

export async function processUploadedProfileDocument(payload: DocumentUploadProcessorPayload) {
  const operationId = payload.operationId ?? `document-upload-${Date.now()}`;
  const doc = await DocumentModel.findOne({ tenantId: payload.tenantId, _id: payload.documentId });
  if (!doc) throw new Error(`Document not found: ${payload.documentId}`);

  const contentText = String(doc.contentText ?? "").trim();
  if (!contentText && payload.profileDocumentType !== "supporting_document") {
    const message =
      payload.profileDocumentType === "cv_resume"
        ? "Master CV text is missing. Paste extracted CV text before activating this document."
        : "Cover letter template text is missing. Paste extracted template text before activating this document.";
    await DocumentModel.findByIdAndUpdate(doc._id, {
      extractionStatus: "Failed",
      extractionError: message,
      isActiveProfileDocument: false,
      generationStatus: "Failed",
    });
    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "document-upload",
      moduleName: "document-upload",
      status: "Warning",
      message,
      operationId,
      relatedRecordType: "Document",
      relatedRecordId: String(doc._id),
      metadata: { profileDocumentType: payload.profileDocumentType },
    });
    return { suppressWorkerCompletionLog: true as const, moduleKey: "document-upload", status: "warning", operationId };
  }

  // Firebase is the primary document store — never overwrite Firebase metadata with Drive.
  if (isFirebaseBacked(doc) || !isGoogleDriveEnabled()) {
    if (contentText && payload.profileDocumentType !== "supporting_document") {
      await DocumentModel.updateMany(
        {
          tenantId: payload.tenantId,
          profileDocumentType: payload.profileDocumentType,
          _id: { $ne: doc._id },
        },
        { isActiveProfileDocument: false }
      );
      await DocumentModel.findByIdAndUpdate(doc._id, {
        status: "Ready",
        generationStatus: "Generated",
        extractionStatus: "Provided",
        extractionError: undefined,
        isActiveProfileDocument: true,
        ...(isFirebaseBacked(doc)
          ? {}
          : {
              storageLocation: "In-app storage",
              storagePath: "In-app storage",
            }),
        metadata: {
          ...((doc.metadata as Record<string, unknown> | undefined) ?? {}),
          workspaceLibrary: true,
          profileDocumentType: payload.profileDocumentType,
          operationId,
        },
      });
    }

    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "document-upload",
      moduleName: "document-upload",
      status: "Success",
      message: isFirebaseBacked(doc)
        ? "Active profile document stored in Firebase Storage."
        : "Active profile document stored in-app (Google Drive disabled).",
      operationId,
      relatedRecordType: "Document",
      relatedRecordId: String(doc._id),
      metadata: { profileDocumentType: payload.profileDocumentType },
    });

    return {
      suppressWorkerCompletionLog: true as const,
      moduleKey: "document-upload",
      status: "completed" as const,
      operationId,
    };
  }

  const auth = await loadGoogleAccessToken({
    tenantId: payload.tenantId,
    provider: "Google Drive",
    requiredScopes: [...GOOGLE_DRIVE_DOCS_WORKER_SCOPES],
  });

  if (!auth.connected) {
    return activateProfileDocumentLocally({
      tenantId: payload.tenantId,
      doc,
      contentText,
      profileDocumentType: payload.profileDocumentType,
      operationId,
      storageLocation: "In-app storage",
      message: `Profile document saved locally; Drive upload skipped: ${auth.reason ?? "Drive not connected"}`,
      status: "Warning",
    });
  }

  try {
    const workspace = await ensureWorkspaceFolderStructure({ tenantId: payload.tenantId, accessToken: auth.accessToken });
    let parentId = workspace.templates.folder.id;
    let storageLocation = "Job Applications/Templates";
    const fileName = String(doc.fileName ?? "Uploaded document");

    if (payload.profileDocumentType === "cv_resume") {
      const cvFolder = await findOrCreateFolder({
        accessToken: auth.accessToken,
        name: "CV",
        parentId: workspace.templates.folder.id,
      });
      parentId = cvFolder.folder.id;
      storageLocation = "Job Applications/Templates/CV";
    }

    const created = await createGoogleDoc({
      accessToken: auth.accessToken,
      name: fileName,
      content: contentText,
      parentId,
    });
    const link = created.webViewLink ?? driveLink(created.id);

    await DocumentModel.updateMany(
      {
        tenantId: payload.tenantId,
        profileDocumentType: payload.profileDocumentType,
        _id: { $ne: doc._id },
      },
      { isActiveProfileDocument: false }
    );

    await DocumentModel.findByIdAndUpdate(doc._id, {
      fileName,
      status: "Ready",
      generationStatus: "Generated",
      extractionStatus: contentText ? "Provided" : "Not Required",
      extractionError: undefined,
      isActiveProfileDocument: payload.profileDocumentType !== "supporting_document",
      storageProvider: "Google Drive",
      storageLocation,
      storagePath: storageLocation,
      storageUrl: link,
      driveFileId: created.id,
      driveFileLink: link,
      googleDriveFileId: created.id,
      googleDriveFolderId: parentId,
      metadata: {
        ...((doc.metadata as Record<string, unknown> | undefined) ?? {}),
        activeProfileDocument: payload.profileDocumentType !== "supporting_document",
        profileDocumentType: payload.profileDocumentType,
        googleDocId: created.id,
        googleDocUrl: link,
        storageLocation,
        operationId,
      },
    });

    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "document-upload",
      moduleName: "document-upload",
      status: "Success",
      message:
        payload.profileDocumentType === "cv_resume"
          ? "Active master CV uploaded to Google Drive."
          : payload.profileDocumentType === "cover_letter_template"
            ? "Active cover letter template uploaded to Google Drive."
            : "Supporting document uploaded to Google Drive.",
      operationId,
      relatedRecordType: "Document",
      relatedRecordId: String(doc._id),
      metadata: { profileDocumentType: payload.profileDocumentType, storageLocation, driveFileId: created.id },
    });

    return {
      suppressWorkerCompletionLog: true as const,
      moduleKey: "document-upload",
      status: "completed",
      operationId,
      documentId: String(doc._id),
      driveFileId: created.id,
      driveFileLink: link,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google Drive sync failed";
    return activateProfileDocumentLocally({
      tenantId: payload.tenantId,
      doc,
      contentText,
      profileDocumentType: payload.profileDocumentType,
      operationId,
      storageLocation: "In-app storage",
      message: `Profile document saved in app; Google Drive upload failed: ${message}`,
      status: "Warning",
    });
  }
}
