import { AutomationLogModel, DocumentModel, IntegrationConnectionModel } from "@jobflow/database/models";
import { GOOGLE_DRIVE_DOCS_WORKER_SCOPES } from "@jobflow/shared/constants/googleScopes";
import { isPublicFileUrl } from "@jobflow/shared/utils/is-public-file-url";
import { loadGoogleAccessToken } from "../lib/google-auth";
import { createGoogleDoc, ensureWorkspaceFolderStructure, findOrCreateFolder } from "../lib/google-drive";
import { redactForLog, serializeWorkerError } from "../utils/worker-error";

export type PdfExportPayload = {
  tenantId: string;
  documentId: string;
  userId: string;
  operationId?: string;
};

function stripPdfMetaUrls(sourceMeta?: Record<string, unknown>): Record<string, unknown> {
  const out = { ...(sourceMeta ?? {}) };
  delete out.pdfUrl;
  delete out.storageUrl;
  return out;
}

async function persistTextExportFallback(input: {
  tenantId: string;
  documentId: string;
  docId: unknown;
  existingMeta: Record<string, unknown>;
  textContent: string;
  operationId: string;
  reason: string;
  fallbackUsed: boolean;
  logMessage: string;
}) {
  const metaClean = stripPdfMetaUrls(input.existingMeta);
  await DocumentModel.findByIdAndUpdate(input.docId, {
    pdfExportStatus: "Preview Only",
    pdfExportError: undefined,
    $unset: { pdfUrl: "", storageUrl: "" },
    metadata: {
      ...metaClean,
      exportStatus: "preview-only",
      textExportAvailable: true,
      textExportContent: input.textContent,
      textExportGeneratedAt: new Date().toISOString(),
      textExportReason: input.reason,
      fallbackUsed: input.fallbackUsed,
    },
  });
  await AutomationLogModel.create({
    tenantId: input.tenantId,
    createdBy: "system",
    moduleKey: "pdf-export",
    moduleName: "pdf-export",
    status: "Warning",
    message: input.logMessage,
    operationId: input.operationId,
    relatedRecordType: "Document",
    relatedRecordId: input.documentId,
    metadata: {
      sourceDocumentId: input.documentId,
      exportStatus: "Preview Only",
      googleDriveFileId: undefined,
      pdfUrlValid: false,
      fallbackUsed: input.fallbackUsed,
      reason: input.reason,
    },
  });
}

export async function processPdfExportJob(payload: PdfExportPayload) {
  const operationId = payload.operationId ?? `pdf-export-${Date.now()}`;
  const doc = await DocumentModel.findOne({ tenantId: payload.tenantId, _id: payload.documentId });
  if (!doc) {
    throw new Error("Document not found for PDF export.");
  }

  try {
    await DocumentModel.findByIdAndUpdate(doc._id, { pdfExportStatus: "Queued", pdfExportError: undefined });

    if (typeof doc.pdfUrl === "string" && doc.pdfUrl.trim() && !isPublicFileUrl(doc.pdfUrl)) {
      await DocumentModel.findByIdAndUpdate(doc._id, { $unset: { pdfUrl: 1, storageUrl: 1 } });
      doc.pdfUrl = undefined;
    }

    const pdfConnection = await IntegrationConnectionModel.findOne({
      tenantId: payload.tenantId,
      provider: "Google Drive",
      status: "Connected",
    })
      .select("_id")
      .lean();

    const textContent = doc.contentText?.trim() || "No text content available.";

    const existingMeta = (doc.metadata ?? {}) as Record<string, unknown>;

    if (!pdfConnection) {
      await persistTextExportFallback({
        tenantId: payload.tenantId,
        documentId: payload.documentId,
        docId: doc._id,
        existingMeta,
        textContent,
        operationId,
        reason: "Google Drive not connected.",
        fallbackUsed: true,
        logMessage: "PDF service not configured; text export generated instead.",
      });
      return {
        suppressWorkerCompletionLog: true as const,
        moduleKey: "pdf-export",
        status: "completed-text",
        operationId,
        documentId: payload.documentId,
        message: "PDF service not configured; text export generated instead.",
      };
    }

    const auth = await loadGoogleAccessToken({
      tenantId: payload.tenantId,
      provider: "Google Drive",
      requiredScopes: [...GOOGLE_DRIVE_DOCS_WORKER_SCOPES],
    });

    if (!auth.connected) {
      await persistTextExportFallback({
        tenantId: payload.tenantId,
        documentId: payload.documentId,
        docId: doc._id,
        existingMeta,
        textContent,
        operationId,
        reason: auth.reason ?? "Google Drive OAuth unavailable.",
        fallbackUsed: true,
        logMessage: "PDF service not configured; text export generated instead.",
      });
      return {
        suppressWorkerCompletionLog: true as const,
        moduleKey: "pdf-export",
        status: "completed-text",
        operationId,
        documentId: payload.documentId,
        message: "PDF service not configured; text export generated instead.",
      };
    }

    try {
      const workspace = await ensureWorkspaceFolderStructure({
        tenantId: payload.tenantId,
        accessToken: auth.accessToken,
      });
      const exportsFolder = await findOrCreateFolder({
        accessToken: auth.accessToken,
        name: "PDF Exports",
        parentId: workspace.applications.folder.id,
      });
      const baseName =
        (doc.fileName ?? "export").replace(/\.[^/.]+$/, "").trim() || "export";
      const created = await createGoogleDoc({
        accessToken: auth.accessToken,
        name: `${baseName} (export)`,
        content: textContent,
        parentId: exportsFolder.folder.id,
      });
      const publicUrl =
        created.webViewLink ?? `https://docs.google.com/document/d/${created.id}/edit`;
      const metaPrev = (doc.metadata ?? {}) as Record<string, unknown>;
      await DocumentModel.findByIdAndUpdate(doc._id, {
        pdfExportStatus: "Exported",
        pdfExportError: undefined,
        pdfUrl: publicUrl,
        pdfExportedAt: new Date(),
        storageUrl: publicUrl,
        googleDriveFileId: created.id,
        metadata: {
          ...metaPrev,
          exportKind: "google-doc",
          exportStatus: "exported",
          textExportAvailable: true,
          fallbackUsed: false,
        },
      });
      await AutomationLogModel.create({
        tenantId: payload.tenantId,
        createdBy: "system",
        moduleKey: "pdf-export",
        moduleName: "pdf-export",
        status: "Success",
        message: "Document exported to Google Doc (Drive).",
        operationId,
        relatedRecordType: "Document",
        relatedRecordId: payload.documentId,
        metadata: {
          sourceDocumentId: payload.documentId,
          exportStatus: "Exported",
          googleDriveFileId: created.id,
          pdfUrlValid: isPublicFileUrl(publicUrl),
          fallbackUsed: false,
          reason: undefined,
        },
      });
      return {
        suppressWorkerCompletionLog: true as const,
        moduleKey: "pdf-export",
        status: "completed",
        operationId,
        documentId: payload.documentId,
        pdfUrl: publicUrl,
        message: "Document exported to Google Doc.",
      };
    } catch (driveErr) {
      const msg = redactForLog(
        driveErr instanceof Error ? driveErr.message : String(driveErr),
      );
      await persistTextExportFallback({
        tenantId: payload.tenantId,
        documentId: payload.documentId,
        docId: doc._id,
        existingMeta,
        textContent,
        operationId,
        reason: msg,
        fallbackUsed: true,
        logMessage: `Google Drive/Docs export failed; text export saved. ${msg}`,
      });
      return {
        suppressWorkerCompletionLog: true as const,
        moduleKey: "pdf-export",
        status: "completed-text",
        operationId,
        documentId: payload.documentId,
        message: "Google export failed; text export generated instead.",
      };
    }
  } catch (error) {
    const ser = serializeWorkerError(error);
    const msg = redactForLog(ser.message);
    await DocumentModel.findByIdAndUpdate(doc._id, { pdfExportStatus: "Failed", pdfExportError: msg });
    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "pdf-export",
      moduleName: "pdf-export",
      status: "Failed",
      message: `PDF export failed: ${msg}`,
      operationId,
      relatedRecordType: "Document",
      relatedRecordId: payload.documentId,
      error: msg,
      metadata: {
        sourceDocumentId: payload.documentId,
        exportStatus: "Failed",
        pdfUrlValid: false,
        fallbackUsed: false,
        reason: msg,
      },
    });
    throw error;
  }
}
