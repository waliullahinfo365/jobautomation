import { randomUUID } from "node:crypto";
import { DocumentModel } from "@jobflow/database/models";
import { isPublicFileUrl } from "@jobflow/shared/utils/is-public-file-url";
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

/**
 * Synchronous PDF export (execute=true, non-production only).
 * Does not call Google APIs — mirrors worker text fallback so stub URLs are never stored.
 */
export async function exportDocumentPdf(input: PdfExportInput): Promise<PdfExportResult> {
  const tenantId = assertTenantId(input.tenantId);
  const operationId = input.operationId ?? randomUUID();
  const document = await findTenantScopedById(DocumentModel, tenantId, input.documentId);
  if (!document) throw new ApiError("Document not found", 404, "NOT_FOUND");

  const idempotencyKey = `pdf-export:${tenantId}:${input.documentId}:${document.version ?? document.updatedAt?.getTime?.() ?? "v1"}`;
  const existingPdf = typeof document.pdfUrl === "string" ? document.pdfUrl : "";
  if (
    document.pdfExportStatus === "Exported" &&
    existingPdf &&
    isPublicFileUrl(existingPdf)
  ) {
    return {
      operationId,
      tenantId,
      documentId: input.documentId,
      status: "existing",
      pdfUrl: existingPdf,
      message: "Document already exported",
    };
  }

  await DocumentModel.findByIdAndUpdate(document._id, { pdfExportStatus: "Queued", pdfExportError: undefined });

  try {
    const textContent = document.contentText?.trim() || "No text content available.";
    const metaPrev =
      document.metadata && typeof document.metadata === "object"
        ? ({ ...(document.metadata as Record<string, unknown>) } as Record<string, unknown>)
        : {};
    delete metaPrev.pdfUrl;
    delete metaPrev.storageUrl;

    await DocumentModel.findByIdAndUpdate(document._id, {
      pdfExportStatus: "Preview Only",
      pdfExportError: undefined,
      $unset: { pdfUrl: "", storageUrl: "" },
      metadata: {
        ...metaPrev,
        exportStatus: "completed-text",
        textExportAvailable: true,
        textExportContent: textContent,
        textExportGeneratedAt: new Date().toISOString(),
        textExportReason: "Sync PDF export generates text preview only; queue pdf-export for Google Doc.",
        fallbackUsed: true,
      },
    });

    await createAutomationLog({
      tenantId,
      moduleKey: "pdf-export",
      moduleName: "PDF Export",
      status: "Warning",
      message: "PDF service not configured; text export generated instead.",
      relatedRecordType: "Document",
      relatedRecordId: input.documentId,
      operationId,
      idempotencyKey,
      metadata: {
        sourceDocumentId: input.documentId,
        exportStatus: "Preview Only",
        pdfUrlValid: false,
        fallbackUsed: true,
        reason: "sync-api-text-only",
      },
    });

    return {
      operationId,
      tenantId,
      documentId: input.documentId,
      status: "completed-text",
      message: "Text export saved. Queue pdf-export for Google Doc.",
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
      metadata: {
        sourceDocumentId: input.documentId,
        exportStatus: "Failed",
        pdfUrlValid: false,
        fallbackUsed: false,
      },
    });
    throw error;
  }
}
