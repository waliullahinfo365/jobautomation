import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { assertTenantId } from "../services/baseTenant.service";
import {
  completeApplyAssistant,
  generateApplyAnswer,
  getApplyDocumentStatus,
  streamApplyDocument,
  type ApplyCompleteStatus,
} from "../services/apply-assistant.service";

export const getApplyDocumentStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const jobId = String(req.params.id);
  const status = await getApplyDocumentStatus({ tenantId, userId, jobId });
  return successResponse(res, status);
});

export const streamApplyDocumentHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const jobId = String(req.params.id);
  const role = String(req.params.role);
  if (role !== "cv" && role !== "cover_letter") {
    res.status(400).json({ success: false, error: "role must be cv or cover_letter" });
    return;
  }

  const file = await streamApplyDocument({
    tenantId,
    userId,
    jobId,
    role,
  });

  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.fileName)}"`);
  res.setHeader("Content-Length", String(file.sizeBytes));
  if (file.exportBranch) res.setHeader("X-Export-Branch", file.exportBranch);
  if (file.sourceMimeType) res.setHeader("X-Drive-Source-Mime-Type", file.sourceMimeType);
  if ("delivery" in file && file.delivery) res.setHeader("X-Apply-Document-Delivery", file.delivery);
  if (role === "cover_letter" && file.coverLetterSource) {
    res.setHeader("X-Cover-Letter-Source", file.coverLetterSource);
  }
  res.send(file.buffer);
});

export const generateApplyAnswerHandler = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const jobId = String(req.params.id);
  const questionText = String((req.body as { questionText?: string }).questionText ?? "");

  const result = await generateApplyAnswer({ tenantId, userId, jobId, questionText });
  return successResponse(res, result);
});

export const completeApplyAssistantHandler = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const jobId = String(req.params.id);
  const body = req.body as {
    status?: ApplyCompleteStatus;
    notes?: string;
    followUpDate?: string;
    proofDocumentId?: string;
    documentIds?: string[];
  };

  if (!body.status) {
    res.status(400).json({ success: false, error: "status is required" });
    return;
  }

  const application = await completeApplyAssistant({
    tenantId,
    userId,
    jobId,
    status: body.status,
    notes: body.notes,
    followUpDate: body.followUpDate ? new Date(body.followUpDate) : undefined,
    proofDocumentId: body.proofDocumentId,
    documentIds: body.documentIds,
  });

  return successResponse(res, application);
});
