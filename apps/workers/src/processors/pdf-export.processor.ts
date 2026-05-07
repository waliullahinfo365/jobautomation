import { AutomationLogModel, DocumentModel, IntegrationConnectionModel } from "@jobflow/database/models";
import { exportDocumentToPdfStub } from "@jobflow/integrations/google-drive/drive.service";
import { redactForLog, serializeWorkerError } from "../utils/worker-error";

export type PdfExportPayload = {
  tenantId: string;
  documentId: string;
  userId: string;
  operationId?: string;
};

export async function processPdfExportJob(payload: PdfExportPayload) {
  const operationId = payload.operationId ?? `pdf-export-${Date.now()}`;
  const doc = await DocumentModel.findOne({ tenantId: payload.tenantId, _id: payload.documentId });
  if (!doc) {
    throw new Error("Document not found for PDF export.");
  }

  try {
    await DocumentModel.findByIdAndUpdate(doc._id, { pdfExportStatus: "Queued", pdfExportError: undefined });

    const pdfConnection = await IntegrationConnectionModel.findOne({
      tenantId: payload.tenantId,
      provider: "Google Drive",
      status: "Connected",
    })
      .select("_id")
      .lean();

    if (!pdfConnection) {
      const textContent = doc.contentText?.trim() || "No text content available.";
      await DocumentModel.findByIdAndUpdate(doc._id, {
        pdfExportStatus: "Exported",
        pdfExportError: undefined,
        metadata: {
          ...(doc.metadata ?? {}),
          exportStatus: "completed-text",
          textExportContent: textContent,
          textExportGeneratedAt: new Date().toISOString(),
          textExportReason: "PDF service not configured; text export generated.",
        },
      });
      await AutomationLogModel.create({
        tenantId: payload.tenantId,
        createdBy: "system",
        moduleKey: "pdf-export",
        moduleName: "pdf-export",
        status: "Warning",
        message: "PDF service not configured; text export generated.",
        operationId,
        relatedRecordType: "Document",
        relatedRecordId: payload.documentId,
      });
      return {
        suppressWorkerCompletionLog: true as const,
        moduleKey: "pdf-export",
        status: "completed-text",
        operationId,
        documentId: payload.documentId,
        message: "PDF service not configured; text export generated.",
      };
    }

    const exported = await exportDocumentToPdfStub({
      tenantId: payload.tenantId,
      documentId: payload.documentId,
      fileName: doc.fileName,
      contentText: doc.contentText,
    });
    await DocumentModel.findByIdAndUpdate(doc._id, {
      pdfExportStatus: "Exported",
      pdfExportError: undefined,
      pdfUrl: exported.pdfUrl,
      pdfExportedAt: new Date(exported.exportedAt),
      storageUrl: exported.pdfUrl,
    });
    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "pdf-export",
      moduleName: "pdf-export",
      status: "Success",
      message: "Document PDF exported",
      operationId,
      relatedRecordType: "Document",
      relatedRecordId: payload.documentId,
      metadata: { pdfUrl: exported.pdfUrl, pdfFileId: exported.pdfFileId },
    });
    return {
      suppressWorkerCompletionLog: true as const,
      moduleKey: "pdf-export",
      status: "completed",
      operationId,
      documentId: payload.documentId,
      pdfUrl: exported.pdfUrl,
      message: "Document exported to PDF.",
    };
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
    });
    throw error;
  }
}
