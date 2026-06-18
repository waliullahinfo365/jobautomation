import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { assertTenantId } from "../services/baseTenant.service";
import {
  completeApplyAssistant,
  generateApplyAnswer,
  generateApplyAnswersFromScreenshot,
  getApplyDocumentStatus,
  streamApplyDocument,
  type ApplyCompleteStatus,
  type ApplyAnswerVariant,
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
  const body = req.body as { questionText?: string; variant?: ApplyAnswerVariant; maxCharacters?: number };
  const questionText = String(body.questionText ?? "");
  const variant = body.variant === "full" ? "full" : "compact";

  const result = await generateApplyAnswer({
    tenantId,
    userId,
    jobId,
    questionText,
    variant,
    maxCharacters: body.maxCharacters,
  });
  return successResponse(res, result);
});

export const generateApplyAnswersFromScreenshotHandler = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const jobId = String(req.params.id);
  const body = req.body as {
    imageBase64?: string;
    mediaType?: string;
    variant?: ApplyAnswerVariant;
    maxCharacters?: number;
  };
  const imageBase64 = String(body.imageBase64 ?? "");
  const variant = body.variant === "full" ? "full" : "compact";

  const result = await generateApplyAnswersFromScreenshot({
    tenantId,
    userId,
    jobId,
    imageBase64,
    mediaType: body.mediaType,
    variant,
    maxCharacters: body.maxCharacters,
  });
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
