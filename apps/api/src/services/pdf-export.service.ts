import { randomUUID } from "node:crypto";
import { DocumentModel } from "@jobflow/database/models";
import { exportDocumentToPdfStub } from "@jobflow/integrations/google-drive/drive.service";
import type { PdfExportResult } from "@jobflow/shared/types/document";
import { createAutomationLog } from "./automation-log.service";
import { assertTenantId, findTenantScopedById } from "./baseTenant.service";
import { ApiError } from "../utils/errors";

type PdfExportInput = {
  tenantId: string;
  documentId: string;
  userId: string;
  operationId?: string;
};

export async function exportDocumentPdf(input: PdfExportInput): Promise<PdfExportResult> {
  const tenantId = assertTenantId(input.tenantId);
  const operationId = input.operationId ?? randomUUID();
  const document = await findTenantScopedById(DocumentModel, tenantId, input.documentId);
  if (!document) throw new ApiError("Document not found", 404, "NOT_FOUND");

  const idempotencyKey = `pdf-export:${tenantId}:${input.documentId}:${document.version ?? document.updatedAt?.getTime?.() ?? "v1"}`;
  if (document.pdfExportStatus === "Exported" && document.pdfUrl) {
    return {
      operationId,
      tenantId,
      documentId: input.documentId,
      status: "existing",
      pdfUrl: document.pdfUrl,
      message: "Document already exported to PDF",
    };
  }

  await DocumentModel.findByIdAndUpdate(document._id, { pdfExportStatus: "Queued", pdfExportError: undefined });

  try {
    const exported = await exportDocumentToPdfStub({
      tenantId,
      documentId: input.documentId,
      fileName: document.fileName,
      contentText: document.contentText,
    });

    await DocumentModel.findByIdAndUpdate(document._id, {
      pdfExportStatus: "Exported",
      pdfUrl: exported.pdfUrl,
      storageUrl: exported.pdfUrl,
      pdfExportedAt: new Date(exported.exportedAt),
      pdfExportError: undefined,
    });

    await createAutomationLog({
      tenantId,
      moduleKey: "pdf-export",
      moduleName: "PDF Export",
      status: "Success",
      message: "Document PDF exported",
      relatedRecordType: "Document",
      relatedRecordId: input.documentId,
      operationId,
      idempotencyKey,
      metadata: { pdfUrl: exported.pdfUrl, pdfFileId: exported.pdfFileId },
    });

    return {
      operationId,
      tenantId,
      documentId: input.documentId,
      status: "completed",
      pdfUrl: exported.pdfUrl,
      message: "Document exported to PDF",
    };
  } catch (error) {
    await DocumentModel.findByIdAndUpdate(document._id, {
      pdfExportStatus: "Failed",
      pdfExportError: error instanceof Error ? error.message : "Unknown error",
    });
    await createAutomationLog({
      tenantId,
      moduleKey: "pdf-export",
      moduleName: "PDF Export",
      status: "Failed",
      message: "Document PDF export failed",
      relatedRecordType: "Document",
      relatedRecordId: input.documentId,
      operationId,
      idempotencyKey,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
