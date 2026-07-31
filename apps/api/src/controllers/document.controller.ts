import { DocumentModel } from "@jobflow/database/models";
import type { Request, Response } from "express";
import { callAnthropicMessages, buildAnthropicModelCandidates, resolveAnthropicApiKey } from "@jobflow/integrations/ai/anthropic-messages";
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
import { processUploadedProfileDocument } from "@jobflow/workers/processors/document-upload";
import { syncDocumentToFirebase } from "../services/document-firebase-sync.service";

function profileTypeFromBody(body: Record<string, unknown>) {
  const explicit = String(body.profileDocumentType ?? "");
  if (explicit === "cv_resume" || explicit === "cover_letter_template" || explicit === "supporting_document") return explicit;
  if (body.type === "cv_resume" || body.type === "CV") return "cv_resume";
  if (body.type === "cover_letter_template" || body.type === "Cover Letter") return "cover_letter_template";
  if (body.type === "supporting_document" || body.type === "Portfolio") return "supporting_document";
  return undefined;
}

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
  const profileDocumentType = profileTypeFromBody(body);
  const workspaceProfileUpload = profileDocumentType && !body.jobId;
  const contentText = typeof body.contentText === "string" ? body.contentText.trim() : "";
  if (workspaceProfileUpload && profileDocumentType !== "supporting_document" && !contentText) {
    throw new ApiError(
      profileDocumentType === "cv_resume"
        ? "Master CV text is missing. Upload a CV with extractable text or paste the extracted CV text before saving."
        : "Cover letter template text is missing. Upload a template with extractable text or paste the extracted template text before saving.",
      422,
      "DOCUMENT_TEXT_REQUIRED"
    );
  }
  const notes = body.notes;
  if (typeof notes === "string" && notes.trim()) {
    const meta = typeof body.metadata === "object" && body.metadata !== null ? { ...(body.metadata as object) } : {};
    body.metadata = { ...meta, notes: notes.trim() };
  }
  delete body.notes;
  if (workspaceProfileUpload) {
    body.profileDocumentType = profileDocumentType;
    body.isActiveProfileDocument = false;
    body.sourceFileName = body.sourceFileName ?? body.fileName;
    body.extractionStatus = contentText ? "Provided" : "Not Required";
    body.metadata = {
      ...(typeof body.metadata === "object" && body.metadata !== null ? (body.metadata as Record<string, unknown>) : {}),
      workspaceLibrary: true,
      profileDocumentType,
    };
  }
  const fileBase64 = typeof body.fileBase64 === "string" ? body.fileBase64 : undefined;
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : undefined;
  delete body.fileBase64;
  delete body.mimeType;

  const row = await createTenantScopedRecord(DocumentModel, tenantId, req.user?.id ?? "system", body as never);
  const userId = req.user?.id ?? "system";
  const documentId = String(row._id);

  try {
    await syncDocumentToFirebase({
      tenantId,
      userId,
      documentId,
      fileName: String(body.fileName ?? "document"),
      contentText,
      fileBase64,
      mimeType,
      jobId: typeof body.jobId === "string" ? body.jobId : undefined,
    });
  } catch {
    // Non-fatal: text document still saved in Mongo
  }

  if (workspaceProfileUpload) {
    try {
      await processUploadedProfileDocument({
        tenantId,
        userId,
        documentId,
        profileDocumentType,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Profile document post-processing failed";
      await DocumentModel.findByIdAndUpdate(row._id, {
        extractionStatus: contentText ? "Provided" : "Failed",
        extractionError: contentText ? msg : undefined,
        isActiveProfileDocument: Boolean(contentText) && profileDocumentType === "cv_resume",
        status: contentText ? "Ready" : "Draft",
        generationStatus: "Failed",
      });
    }
    const refreshed = await findTenantScopedById(DocumentModel, tenantId, documentId);
    const plain = refreshed && typeof refreshed.toObject === "function" ? refreshed.toObject() : refreshed ?? row;
    return successResponse(res, sanitizeDocumentForApi(plain as Record<string, unknown>), "Created", 201);
  }
  const refreshed = await findTenantScopedById(DocumentModel, tenantId, documentId);
  const plain = refreshed && typeof refreshed.toObject === "function" ? refreshed.toObject() : refreshed ?? row;
  return successResponse(res, sanitizeDocumentForApi(plain as Record<string, unknown>), "Created", 201);
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
  const body = { ...req.body } as Record<string, unknown>;
  if (body.isActiveProfileDocument === true) {
    const existing = await findTenantScopedById(DocumentModel, tenantId, req.params.id);
    if (!existing) throw new ApiError("Not found", 404, "NOT_FOUND");
    const profileDocumentType =
      String((existing as Record<string, unknown>).profileDocumentType ?? "") ||
      profileTypeFromBody({ type: (existing as Record<string, unknown>).type });
    if (profileDocumentType) {
      await DocumentModel.updateMany(
        { tenantId, profileDocumentType, _id: { $ne: req.params.id } },
        { isActiveProfileDocument: false }
      );
      body.profileDocumentType = profileDocumentType;
    }
  }
  const row = await updateTenantScopedById(DocumentModel, tenantId, req.params.id, body);
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

export const scoreAtsDocument = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const body = req.body as Record<string, unknown>;

  let cvText = String(body.contentText ?? body.content ?? "");
  const docId = body.documentId ? String(body.documentId) : null;

  if (!cvText && docId) {
    const doc = await findTenantScopedById(DocumentModel, tenantId, docId);
    if (doc) cvText = String((doc as Record<string, unknown>).content ?? "");
  }

  if (!cvText) throw new ApiError("No CV content provided", 422, "VALIDATION_ERROR");

  const apiKey = resolveAnthropicApiKey();
  if (!apiKey) throw new ApiError("AI not configured", 503, "SERVICE_UNAVAILABLE");

  const prompt = `You are an ATS (Applicant Tracking System) expert. Score this CV and provide improvement recommendations. Output ONLY valid JSON with no markdown fences.

CV Content:
${cvText.slice(0, 5000)}

Output exactly:
{
  "overallScore": <integer 0-100>,
  "categories": {
    "keywords": <integer 0-100>,
    "formatting": <integer 0-100>,
    "experience": <integer 0-100>,
    "education": <integer 0-100>,
    "skills": <integer 0-100>
  },
  "improvements": ["<specific improvement suggestion>", ...],
  "improvedHeadline": "<rewritten headline for ATS>",
  "improvedSummary": "<rewritten 3-4 sentence professional summary, ATS-optimised>"
}`;

  const modelCandidates = buildAnthropicModelCandidates();
  const result = await callAnthropicMessages({ prompt, apiKey, modelCandidates, maxTokens: 1000, temperature: 0.2 });
  if (!result.ok) throw new ApiError("AI scoring failed", 503, "SERVICE_UNAVAILABLE");

  let parsed: Record<string, unknown> = {};
  try {
    const m = result.text.match(/\{[\s\S]*\}/);
    if (m) parsed = JSON.parse(m[0]) as Record<string, unknown>;
  } catch { throw new ApiError("Failed to parse AI response", 503, "SERVICE_UNAVAILABLE"); }

  return successResponse(res, parsed);
});
