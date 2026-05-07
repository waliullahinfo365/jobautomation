import { DocumentModel, ReportModel } from "@jobflow/database/models";
import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { paginatedResponse, successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { assertTenantId, buildTenantFilter, createTenantScopedRecord, findTenantScopedById, updateTenantScopedById } from "../services/baseTenant.service";
import { getPagination } from "../utils/pagination";
import { getDailyDigestMetrics, getReportHistoryStats, getWeeklyPerformanceMetrics } from "../services/report-analytics.service";
import { generateDailyDigest, generateWeeklyReport, sendReportTest } from "../services/report-generation.service";
import { enqueueAutomationModule } from "../services/automation-queue.service";
export const listReports = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const { page, limit, skip } = getPagination(req.query);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const filter: Record<string, unknown> = buildTenantFilter(tenantId);
  if (status) filter.status = status;
  if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { type: { $regex: search, $options: "i" } }];
  const [rows, total] = await Promise.all([
    ReportModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    ReportModel.countDocuments(filter),
  ]);
  return paginatedResponse(res, rows, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const createReport = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const row = await createTenantScopedRecord(ReportModel, tenantId, req.user?.id ?? "system", req.body);
  return successResponse(res, row, "Created", 201);
});

export const getReportById = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const row = await findTenantScopedById(ReportModel, tenantId, req.params.id);
  if (!row) throw new ApiError("Not found", 404, "NOT_FOUND");
  return successResponse(res, row);
});

export const updateReport = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const row = await updateTenantScopedById(ReportModel, tenantId, req.params.id, req.body);
  if (!row) throw new ApiError("Not found", 404, "NOT_FOUND");
  return successResponse(res, row, "Updated");
});

export const runDailyDigest = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const execute = req.query.execute === "true";
  if (execute) {
    if (process.env.NODE_ENV === "production") throw new ApiError("Direct execute=true is disabled in production", 403, "FORBIDDEN");
    const result = await generateDailyDigest({ tenantId, userId, date: req.body.date, send: req.body.send, force: req.body.force });
    return successResponse(res, result, "Daily digest generated");
  }
  const queued = await enqueueAutomationModule({
    tenantId,
    userId,
    moduleKey: "daily-digest",
    payload: { date: req.body.date, send: req.body.send, force: req.body.force },
    source: "api",
  });
  return successResponse(
    res,
    { operationId: queued.operationId, jobId: queued.jobId, moduleKey: "daily-digest", status: queued.status, message: queued.message },
    "Daily digest queued"
  );
});

export const runWeeklyReport = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const execute = req.query.execute === "true";
  if (execute) {
    if (process.env.NODE_ENV === "production") throw new ApiError("Direct execute=true is disabled in production", 403, "FORBIDDEN");
    const result = await generateWeeklyReport({
      tenantId,
      userId,
      weekStart: req.body.weekStart,
      weekEnd: req.body.weekEnd,
      send: req.body.send,
      force: req.body.force,
    });
    return successResponse(res, result, "Weekly report generated");
  }
  const queued = await enqueueAutomationModule({
    tenantId,
    userId,
    moduleKey: "weekly-report",
    payload: { weekStart: req.body.weekStart, weekEnd: req.body.weekEnd, send: req.body.send, force: req.body.force },
    source: "api",
  });
  return successResponse(
    res,
    { operationId: queued.operationId, jobId: queued.jobId, moduleKey: "weekly-report", status: queued.status, message: queued.message },
    "Weekly report queued"
  );
});

export const sendTestReport = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const result = await sendReportTest({ tenantId, reportId: req.params.id, userId: req.user?.id ?? "system", to: req.body?.to });
  return successResponse(res, result, "Report test sent");
});

export const generateReport = asyncHandler(async (req: Request, res) => {
  return runWeeklyReport(req, res, () => undefined);
});

export const previewDailyDigest = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const date = typeof req.body?.date === "string" ? new Date(req.body.date) : new Date();
  const metrics = await getDailyDigestMetrics({ tenantId, date });
  const latest = await ReportModel.findOne({ tenantId, type: "Daily Digest" }).sort({ generatedAt: -1 }).lean();
  const recommendations =
    metrics.failedAutomations > 0
      ? ["Review failed automations and re-run critical jobs.", "Prioritize follow-ups due today before end-of-day."]
      : ["No critical automation failures detected today.", "Keep current application cadence for top response sources."];
  return successResponse(res, {
    date: metrics.date,
    summary: `Daily digest ${metrics.date}: ${metrics.newJobs} new jobs, ${metrics.applicationsSent} applications sent, ${metrics.repliesReceived} replies.`,
    metrics,
    recommendations,
    latestReportId: latest && !Array.isArray(latest) ? String((latest as { _id?: unknown })._id ?? "") : undefined,
  });
});

export const previewWeeklyReport = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const now = new Date();
  const weekStart = typeof req.body?.weekStart === "string" ? new Date(req.body.weekStart) : new Date(now.setDate(now.getDate() - (now.getDay() || 7) + 1));
  const weekEnd = typeof req.body?.weekEnd === "string" ? new Date(req.body.weekEnd) : new Date(new Date(weekStart).setDate(weekStart.getDate() + 6));
  const metrics = await getWeeklyPerformanceMetrics({ tenantId, weekStart, weekEnd });
  const latest = await ReportModel.findOne({ tenantId, type: "Weekly Performance" }).sort({ generatedAt: -1 }).lean();
  return successResponse(res, {
    weekStart: metrics.weekStart,
    weekEnd: metrics.weekEnd,
    summary: `Weekly performance ${metrics.weekStart} to ${metrics.weekEnd}: ${metrics.applicationsSubmitted} applications, ${metrics.repliesReceived} replies, ${metrics.interviewsScheduled} interviews.`,
    metrics,
    recommendations: metrics.recommendations ?? [],
    latestReportId: latest && !Array.isArray(latest) ? String((latest as { _id?: unknown })._id ?? "") : undefined,
  });
});

export const sendDailyDigestTest = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const queued = await enqueueAutomationModule({
    tenantId,
    userId,
    moduleKey: "daily-digest",
    payload: { date: req.body?.date, send: true, force: req.body?.force ?? false, to: req.body?.to },
    source: "api",
  });
  return successResponse(
    res,
    { operationId: queued.operationId, jobId: queued.jobId, moduleKey: "daily-digest", status: queued.status, message: queued.message },
    "Daily digest test queued"
  );
});

export const sendWeeklyReportTest = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const queued = await enqueueAutomationModule({
    tenantId,
    userId,
    moduleKey: "weekly-report",
    payload: { weekStart: req.body?.weekStart, weekEnd: req.body?.weekEnd, send: true, force: req.body?.force ?? false, to: req.body?.to },
    source: "api",
  });
  return successResponse(
    res,
    { operationId: queued.operationId, jobId: queued.jobId, moduleKey: "weekly-report", status: queued.status, message: queued.message },
    "Weekly report test queued"
  );
});

export const queuePdfExportFromReports = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const document = await findTenantScopedById(DocumentModel, tenantId, req.body.documentId);
  if (!document) throw new ApiError("Document not found", 404, "NOT_FOUND");
  const queued = await enqueueAutomationModule({
    tenantId,
    userId,
    moduleKey: "pdf-export",
    payload: { documentId: req.body.documentId },
    source: "api",
  });
  return successResponse(
    res,
    { operationId: queued.operationId, jobId: queued.jobId, moduleKey: "pdf-export", status: queued.status, message: queued.message },
    "PDF export queued"
  );
});

export const getReportStats = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const stats = await getReportHistoryStats({ tenantId });
  const [dailySent, weeklySent, pdfExports] = await Promise.all([
    ReportModel.countDocuments({ tenantId, type: "Daily Digest", deliveryStatus: "Sent" }),
    ReportModel.countDocuments({ tenantId, type: "Weekly Performance", deliveryStatus: "Sent" }),
    DocumentModel.countDocuments({ tenantId, pdfExportStatus: "Exported" }),
  ]);
  const latest = stats.latestReports[0];
  return successResponse(res, {
    ...stats,
    reportsGenerated: stats.totalReports,
    dailyDigestsSent: dailySent,
    weeklyReportsSent: weeklySent,
    pdfExports,
    successRate: stats.totalReports > 0 ? Math.round(((stats.totalReports - stats.failedReports) / stats.totalReports) * 100) : 0,
    lastReport: latest?.generatedAt ? new Date(String(latest.generatedAt)).toISOString() : "—",
  });
});

export const getDailyAnalytics = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const date = typeof req.query.date === "string" ? new Date(req.query.date) : new Date();
  const metrics = await getDailyDigestMetrics({ tenantId, date });
  return successResponse(res, metrics);
});

export const getWeeklyAnalytics = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const now = new Date();
  const weekStart = typeof req.query.weekStart === "string" ? new Date(req.query.weekStart) : new Date(now.setDate(now.getDate() - (now.getDay() || 7) + 1));
  const weekEnd = typeof req.query.weekEnd === "string" ? new Date(req.query.weekEnd) : new Date(new Date(weekStart).setDate(weekStart.getDate() + 6));
  const metrics = await getWeeklyPerformanceMetrics({ tenantId, weekStart, weekEnd });
  return successResponse(res, metrics);
});
