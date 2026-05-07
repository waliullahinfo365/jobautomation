import { DocumentModel, ReportModel } from "@jobflow/database/models";
import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { paginatedResponse, successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { assertTenantId, buildTenantFilter, createTenantScopedRecord, findTenantScopedById, updateTenantScopedById } from "../services/baseTenant.service";
import { logApiAction } from "../services/automation-log.service";
import {
  defaultReportWeekBounds,
  getDailyDigestMetrics,
  getReportHistoryStats,
  getReportsSummary,
  getWeeklyPerformanceMetrics,
} from "../services/report-analytics.service";
import { buildDailyDigestMarkdown, buildWeeklyPerformanceMarkdown } from "../services/report-markdown.builder";
import { getPagination } from "../utils/pagination";
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
  return successResponse(res, result, result.previewOnly ? "No provider delivered — preview only" : "Report test processed");
});

export const generateReport = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const body = req.body as {
    type?: string;
    force?: boolean;
    send?: boolean;
    weekStart?: string;
    weekEnd?: string;
    date?: string;
  };
  const type = body.type ?? "weekly-report";
  const force = Boolean(body.force);

  if (type === "daily-digest") {
    const queued = await enqueueAutomationModule({
      tenantId,
      userId,
      moduleKey: "daily-digest",
      payload: { date: body.date, send: body.send ?? false, force },
      source: "api",
    });
    await logApiAction({
      tenantId,
      moduleKey: "report-generation",
      status: "Success",
      message: "Daily digest generation queued",
      operationId: queued.operationId,
      metadata: { moduleKey: "daily-digest", jobId: queued.jobId },
    });
    return successResponse(
      res,
      {
        operationId: queued.operationId,
        jobId: queued.jobId,
        moduleKey: "daily-digest",
        status: queued.status,
        message: queued.message,
      },
      "Report generation started"
    );
  }

  const queued = await enqueueAutomationModule({
    tenantId,
    userId,
    moduleKey: "weekly-report",
    payload: { weekStart: body.weekStart, weekEnd: body.weekEnd, send: body.send ?? false, force },
    source: "api",
  });
  await logApiAction({
    tenantId,
    moduleKey: "report-generation",
    status: "Success",
    message: type === "performance-report" ? "Performance report generation queued" : "Weekly report generation queued",
    operationId: queued.operationId,
    metadata: { moduleKey: "weekly-report", requestedType: type, jobId: queued.jobId },
  });
  return successResponse(
    res,
    {
      operationId: queued.operationId,
      jobId: queued.jobId,
      moduleKey: "weekly-report",
      status: queued.status,
      message: queued.message,
    },
    "Report generation started"
  );
});

export const getSummary = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const summary = await getReportsSummary({ tenantId });
  return successResponse(res, summary);
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
  const markdown = buildDailyDigestMarkdown(metrics, recommendations);
  await logApiAction({
    tenantId,
    moduleKey: "daily-digest",
    status: "Success",
    message: "Daily digest preview generated",
    metadata: { date: metrics.date },
  });
  return successResponse(res, {
    date: metrics.date,
    summary: `Daily digest ${metrics.date}: ${metrics.newJobs} new jobs, ${metrics.applicationsSent} applications sent, ${metrics.repliesReceived} replies.`,
    markdown,
    metrics,
    recommendations,
    latestReportId: latest && !Array.isArray(latest) ? String((latest as { _id?: unknown })._id ?? "") : undefined,
  });
});

export const previewWeeklyReport = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const { weekStart, weekEnd } =
    typeof req.body?.weekStart === "string" && typeof req.body?.weekEnd === "string"
      ? { weekStart: new Date(req.body.weekStart), weekEnd: new Date(req.body.weekEnd) }
      : defaultReportWeekBounds();
  const metrics = await getWeeklyPerformanceMetrics({ tenantId, weekStart, weekEnd });
  const latest = await ReportModel.findOne({ tenantId, type: "Weekly Performance" }).sort({ generatedAt: -1 }).lean();
  const markdown = buildWeeklyPerformanceMarkdown(metrics);
  await logApiAction({
    tenantId,
    moduleKey: "weekly-report",
    status: "Success",
    message: "Weekly report preview generated",
    metadata: { weekStart: metrics.weekStart, weekEnd: metrics.weekEnd },
  });
  return successResponse(res, {
    weekStart: metrics.weekStart,
    weekEnd: metrics.weekEnd,
    summary: `Weekly performance ${metrics.weekStart} to ${metrics.weekEnd}: ${metrics.applicationsSubmitted} applications, ${metrics.repliesReceived} replies, ${metrics.interviewsScheduled} interviews.`,
    markdown,
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
  await logApiAction({
    tenantId,
    moduleKey: "daily-digest",
    status: "Success",
    message: "Daily digest test queued",
    operationId: queued.operationId,
    metadata: { jobId: queued.jobId },
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
  await logApiAction({
    tenantId,
    moduleKey: "weekly-report",
    status: "Success",
    message: "Weekly report test queued",
    operationId: queued.operationId,
    metadata: { jobId: queued.jobId },
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
  await logApiAction({
    tenantId,
    moduleKey: "pdf-export",
    status: "Success",
    message: "PDF export queued",
    operationId: queued.operationId,
    relatedRecordType: "Document",
    relatedRecordId: req.body.documentId,
    metadata: { jobId: queued.jobId },
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
  const { weekStart, weekEnd } =
    typeof req.query.weekStart === "string" && typeof req.query.weekEnd === "string"
      ? { weekStart: new Date(req.query.weekStart), weekEnd: new Date(req.query.weekEnd) }
      : defaultReportWeekBounds();
  const metrics = await getWeeklyPerformanceMetrics({ tenantId, weekStart, weekEnd });
  return successResponse(res, metrics);
});
