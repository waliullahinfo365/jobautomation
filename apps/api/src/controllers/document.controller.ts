import { DocumentModel } from "@jobflow/database/models";
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { paginatedResponse, successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { logApiAction } from "../services/automation-log.service";
import { assertTenantId, buildTenantFilter, createTenantScopedRecord, findTenantScopedById, updateTenantScopedById } from "../services/baseTenant.service";
import { getPagination } from "../utils/pagination";
import { routeCvToJobFolder } from "../services/cv-routing.service";
import { exportDocumentPdf } from "../services/pdf-export.service";
import { enqueueAutomationModule } from "../services/automation-queue.service";
import { sanitizeDocumentForApi } from "../utils/document-response";
export const listDocuments = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const { page, limit, skip } = getPagination(req.query);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const jobId = typeof req.query.jobId === "string" ? req.query.jobId : undefined;
  const workspaceProfile = typeof req.query.workspaceProfile === "string" && req.query.workspaceProfile === "true";
  const filter: Record<string, unknown> = buildTenantFilter(tenantId);
  if (status) filter.status = status;
  if (jobId) filter.jobId = jobId;

  const andClauses: Record<string, unknown>[] = [];
  if (workspaceProfile) {
    andClauses.push({ $or: [{ jobId: { $exists: false } }, { jobId: null }, { jobId: "" }] });
  }
  if (search) {
    andClauses.push({
      $or: [
        { fileName: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
        { storagePath: { $regex: search, $options: "i" } },
      ],
    });
  }
  if (andClauses.length > 0) {
    filter.$and = andClauses;
  }

  const [rows, total] = await Promise.all([
    DocumentModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    DocumentModel.countDocuments(filter),
  ]);
  const sanitized = rows.map((r) => sanitizeDocumentForApi(r as Record<string, unknown>));
  return paginatedResponse(res, sanitized, { page, limit, total, totalPages: Math.ceil(total / limit) });
});
export const createDocument = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const body = { ...req.body } as Record<string, unknown>;
  const notes = body.notes;
  if (typeof notes === "string" && notes.trim()) {
    const meta = typeof body.metadata === "object" && body.metadata !== null ? { ...(body.metadata as object) } : {};
    body.metadata = { ...meta, notes: notes.trim() };
  }
  delete body.notes;
  const row = await createTenantScopedRecord(DocumentModel, tenantId, req.user?.id ?? "system", body as never);
  return successResponse(res, row, "Created", 201);
});
export const getDocumentById = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const row = await findTenantScopedById(DocumentModel, tenantId, req.params.id);
  if (!row) throw new ApiError("Not found", 404, "NOT_FOUND");
  const plain = typeof row.toObject === "function" ? row.toObject() : row;
  return successResponse(res, sanitizeDocumentForApi(plain));
});
export const updateDocument = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const row = await updateTenantScopedById(DocumentModel, tenantId, req.params.id, req.body);
  if (!row) throw new ApiError("Not found", 404, "NOT_FOUND");
  const plain = typeof row.toObject === "function" ? row.toObject() : row;
  return successResponse(res, sanitizeDocumentForApi(plain), "Updated");
});

/** Attachment fallback: plain text from `contentText` or metadata `textExportContent`. */
export const downloadDocumentText = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const row = await findTenantScopedById(DocumentModel, tenantId, req.params.id);
  if (!row) throw new ApiError("Not found", 404, "NOT_FOUND");
  const meta =
    row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {};
  const fromMeta = typeof meta.textExportContent === "string" ? meta.textExportContent : "";
  const body =
    typeof row.contentText === "string" && row.contentText.trim() ? row.contentText : fromMeta || "";
  const safeName = String(row.fileName ?? "document")
    .replace(/[^\w.\- ]+/g, "_")
    .slice(0, 120);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}.txt"`);
  res.send(body);
});
export const routeCv = asyncHandler(async (req: Request, res) => { const tenantId=assertTenantId(req.tenantId); const documentId=req.params.id; const jobId=req.body.jobId as string; const userId=req.user?.id ?? "system"; const execute=req.query.execute==="true"; if(execute){ if(process.env.NODE_ENV==="production") throw new ApiError("Direct execute=true is disabled in production",403,"FORBIDDEN"); const result=await routeCvToJobFolder({ tenantId, documentId, jobId, userId }); return successResponse(res,result,'CV routed'); } const queued=await enqueueAutomationModule({ tenantId, userId, moduleKey:"cv-routing", payload:{ documentId, jobId }, source:"api" }); return successResponse(res,{operationId:queued.operationId,jobId:queued.jobId,moduleKey:"cv-routing",status:queued.status,message:queued.message},'CV routing queued'); });
export const exportPdf = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const documentId = req.params.id;
  const userId = req.user?.id ?? "system";
  const execute = req.query.execute === "true";
  if (execute) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError("Direct execute=true is disabled in production", 403, "FORBIDDEN");
    }
    const result = await exportDocumentPdf({ tenantId, documentId, userId });
    const ok = Boolean(result.pdfUrl);
    await logApiAction({
      tenantId,
      moduleKey: "pdf-export",
      status: ok ? "Success" : "Warning",
      message: result.message,
      relatedRecordType: "Document",
      relatedRecordId: req.params.id,
      metadata: {
        operationId: result.operationId,
        exportStatus: result.status,
        pdfUrlValid: Boolean(result.pdfUrl),
        fallbackUsed: result.status === "completed-text",
      },
    });
    return successResponse(res, result, "PDF export completed");
  }
  const queued = await enqueueAutomationModule({
    tenantId,
    userId,
    moduleKey: "pdf-export",
    payload: { documentId },
    source: "api",
  });
  return successResponse(
    res,
    {
      operationId: queued.operationId,
      jobId: queued.jobId,
      moduleKey: "pdf-export",
      status: queued.status,
      message: queued.message,
    },
    "PDF export queued",
  );
});
