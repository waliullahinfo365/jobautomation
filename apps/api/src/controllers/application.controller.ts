import { ApplicationModel } from "@jobflow/database/models";
import { documentApplicationEvent } from "@jobflow/database";
import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { paginatedResponse, successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { logApiAction } from "../services/automation-log.service";
import {
  assertTenantId,
  buildTenantFilter,
  createTenantScopedRecord,
  findTenantScopedById,
  updateTenantScopedById,
} from "../services/baseTenant.service";
import { getPagination } from "../utils/pagination";
import { markApplicationApplied } from "../services/applied-status.service";
import {
  findDueFollowUps,
  markFollowUpSent as markFollowUpSentService,
  processDueFollowUpsForTenant,
  scheduleFollowUp as scheduleFollowUpService,
  toFollowUpReminderResult,
} from "../services/follow-up-reminder.service";

export const listApplications = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const { page, limit, skip } = getPagination(req.query);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const filter: Record<string, unknown> = buildTenantFilter(tenantId);
  if (status) filter.applicationStatus = status;
  if (search) {
    filter.$or = [
      { company: { $regex: search, $options: "i" } },
      { position: { $regex: search, $options: "i" } },
      { contactEmail: { $regex: search, $options: "i" } },
    ];
  }
  const [rows, total] = await Promise.all([
    ApplicationModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    ApplicationModel.countDocuments(filter),
  ]);
  return paginatedResponse(res, rows, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const createApplication = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const body = req.body as Record<string, unknown>;
  const jobId = body.jobId ? String(body.jobId) : "";

  if (jobId) {
    const row = await documentApplicationEvent({
      tenantId,
      userId,
      jobId,
      applicationStatus: String(body.applicationStatus ?? "Applied"),
      applyMethod: (body.applyMethod as "manual_log") ?? "manual_log",
      appliedAt: body.dateApplied ? new Date(String(body.dateApplied)) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      company: body.company ? String(body.company) : undefined,
      position: body.position ? String(body.position) : undefined,
      source: body.source ? String(body.source) : undefined,
      jobUrl: body.jobUrl ? String(body.jobUrl) : undefined,
      contactEmail: body.contactEmail ? String(body.contactEmail) : undefined,
      responseStatus: body.responseStatus ? String(body.responseStatus) : undefined,
    });
    return successResponse(res, row, "Created", 201);
  }

  const row = await createTenantScopedRecord(ApplicationModel, tenantId, userId, req.body);
  return successResponse(res, row, "Created", 201);
});

export const getApplicationById = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const row = await findTenantScopedById(ApplicationModel, tenantId, req.params.id);
  if (!row) throw new ApiError("Not found", 404, "NOT_FOUND");
  return successResponse(res, row);
});

export const updateApplication = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const existing = await findTenantScopedById(ApplicationModel, tenantId, req.params.id);
  if (!existing) throw new ApiError("Not found", 404, "NOT_FOUND");

  const nextStatus = req.body?.applicationStatus ? String(req.body.applicationStatus) : undefined;
  const jobId = String((existing as { jobId?: string }).jobId ?? "");

  if (nextStatus && jobId) {
    const row = await documentApplicationEvent({
      tenantId,
      userId,
      jobId,
      applicationId: req.params.id,
      applicationStatus: nextStatus,
      applyMethod: "manual",
      appliedAt: req.body?.dateApplied ? new Date(String(req.body.dateApplied)) : undefined,
      notes: req.body?.notes ? String(req.body.notes) : undefined,
      followUpDate: req.body?.followUpDate ? new Date(String(req.body.followUpDate)) : undefined,
    });
    return successResponse(res, row, "Updated");
  }

  const row = await updateTenantScopedById(ApplicationModel, tenantId, req.params.id, req.body);
  if (!row) throw new ApiError("Not found", 404, "NOT_FOUND");
  return successResponse(res, row, "Updated");
});

export const markApplied = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const appliedAt = req.body.appliedAt ? new Date(req.body.appliedAt) : undefined;
  const row = await markApplicationApplied({
    tenantId,
    applicationId: req.params.id,
    userId: req.user?.id ?? "system",
    appliedAt,
  });
  return successResponse(res, row, "Marked applied");
});

export const scheduleFollowUp = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const followUpDate = new Date(req.body.followUpDate);
  const row = await scheduleFollowUpService({
    tenantId,
    applicationId: req.params.id,
    userId: req.user?.id ?? "system",
    followUpDate,
    message: req.body.message,
  });
  if (!row) throw new ApiError("Not found", 404, "NOT_FOUND");
  const result = toFollowUpReminderResult({
    operationId: `followup-${Date.now()}`,
    tenantId,
    applicationId: req.params.id,
    status: "scheduled",
    followUpDate,
    message: "Follow-up scheduled",
  });
  return successResponse(res, { application: row, result }, "Follow-up scheduled");
});

export const markFollowUpSent = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const sentAt = req.body.sentAt ? new Date(req.body.sentAt) : undefined;
  const row = await markFollowUpSentService({
    tenantId,
    applicationId: req.params.id,
    userId: req.user?.id ?? "system",
    sentAt,
  });
  return successResponse(res, row, "Follow-up marked sent");
});

export const listDueFollowUps = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const now = req.query.now ? new Date(String(req.query.now)) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const rows = await findDueFollowUps({ tenantId, now, limit });
  return successResponse(res, rows);
});

export const processDueFollowUps = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const now = req.body.now ? new Date(req.body.now) : undefined;
  const result = await processDueFollowUpsForTenant({ tenantId, now });
  await logApiAction({
    tenantId,
    moduleKey: "follow-up-reminder",
    status: result.failed > 0 ? "Warning" : "Success",
    message: "Due follow-ups processed",
    metadata: result,
  });
  return successResponse(res, result, "Due follow-ups processed");
});
