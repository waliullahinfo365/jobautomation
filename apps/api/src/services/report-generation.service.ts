import { randomUUID } from "node:crypto";
import { ReportModel } from "@database/models";
import { sendReportEmailStub } from "@integrations/smtp/smtp.service";
import type { DailyDigestMetrics, ReportDeliveryResult, ReportGenerationResult, WeeklyPerformanceMetrics } from "@shared/types/report";
import { createAutomationLog } from "./automation-log.service";
import { assertTenantId, findTenantScopedById } from "./baseTenant.service";
import { getDailyDigestMetrics, getWeeklyPerformanceMetrics } from "./report-analytics.service";
import { ApiError } from "../utils/errors";
import { assertCanGenerateReport } from "./plan-limit.service";
import { incrementUsage } from "./usage.service";

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getWeekBoundaries(inputDate = new Date()) {
  const current = new Date(inputDate);
  const day = current.getUTCDay() || 7;
  const weekStart = new Date(current);
  weekStart.setUTCDate(current.getUTCDate() - day + 1);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

function summaryForDaily(metrics: DailyDigestMetrics): string {
  return `Daily digest ${metrics.date}: ${metrics.newJobs} new jobs, ${metrics.applicationsSent} applications sent, ${metrics.repliesReceived} replies, ${metrics.interviewsScheduled} interviews, ${metrics.offersReceived} offers.`;
}

function summaryForWeekly(metrics: WeeklyPerformanceMetrics): string {
  return `Weekly performance ${metrics.weekStart} to ${metrics.weekEnd}: ${metrics.applicationsSubmitted} applications, ${metrics.repliesReceived} replies (${metrics.responseRate}), ${metrics.interviewsScheduled} interviews (${metrics.interviewConversionRate}), ${metrics.offersReceived} offers (${metrics.offerRate}).`;
}

async function sendReportDelivery(input: { tenantId: string; reportId: string; to?: string | string[]; operationId: string }): Promise<ReportDeliveryResult> {
  const report = await findTenantScopedById(ReportModel, input.tenantId, input.reportId);
  if (!report) throw new ApiError("Report not found", 404, "NOT_FOUND");

  await ReportModel.findByIdAndUpdate(report._id, { deliveryStatus: "Queued", deliveryError: undefined });

  const sendResult = await sendReportEmailStub({
    to: input.to ?? "reports@example.local",
    subject: `[Stub] ${report.name}`,
    html: `<h1>${report.name}</h1><p>${report.summaryText ?? ""}</p>`,
    text: `${report.name}\n${report.summaryText ?? ""}`,
    reportType: report.type,
  });

  await ReportModel.findByIdAndUpdate(report._id, {
    deliveryStatus: "Sent",
    deliveryId: sendResult.deliveryId,
    sentAt: new Date(sendResult.sentAt),
    sentTo: Array.isArray(input.to) ? input.to : [input.to ?? "reports@example.local"],
    status: "Sent",
    deliveryMethod: "smtp-stub",
    deliveryError: undefined,
  });

  return {
    operationId: input.operationId,
    tenantId: input.tenantId,
    reportId: input.reportId,
    deliveryStatus: "Sent",
    deliveryId: sendResult.deliveryId,
    message: "Report sent via stub delivery",
  };
}

export async function getReportByPeriod(input: { tenantId: string; type: "Daily Digest" | "Weekly Performance" | "Manual Report" | "PDF Export"; periodKey: string }) {
  const tenantId = assertTenantId(input.tenantId);
  return ReportModel.findOne({ tenantId, type: input.type, periodKey: input.periodKey });
}

export async function generateDailyDigest(input: {
  tenantId: string;
  userId: string;
  date?: string;
  send?: boolean;
  force?: boolean;
  operationId?: string;
}): Promise<ReportGenerationResult> {
  const tenantId = assertTenantId(input.tenantId);
  const operationId = input.operationId ?? randomUUID();
  const targetDate = input.date ? new Date(input.date) : new Date();
  const periodKey = formatDate(targetDate);
  const idempotencyKey = `daily-digest:${tenantId}:${periodKey}`;

  const existing = await getReportByPeriod({ tenantId, type: "Daily Digest", periodKey });
  if (existing && !input.force) {
    return {
      operationId,
      tenantId,
      reportId: String(existing._id),
      type: existing.type,
      status: existing.status,
      periodKey,
      metrics: (existing.metrics as DailyDigestMetrics) ?? (existing.data as DailyDigestMetrics),
      summaryText: existing.summaryText ?? "",
      deliveryStatus: (existing.deliveryStatus as "Not Sent" | "Queued" | "Sent" | "Failed") ?? "Not Sent",
    };
  }

  await createAutomationLog({
    tenantId,
    moduleKey: "daily-digest",
    moduleName: "Daily Digest",
    status: "Running",
    message: "Daily digest generation started",
    operationId,
    idempotencyKey,
  });

  try {
    await assertCanGenerateReport(tenantId);
    const metrics = await getDailyDigestMetrics({ tenantId, date: targetDate });
    const summaryText = summaryForDaily(metrics);
    const recommendations = metrics.failedAutomations > 0 ? ["Review failed automations and re-run critical jobs."] : ["No critical automation failures detected today."];

    const report = await ReportModel.findOneAndUpdate(
      { tenantId, type: "Daily Digest", periodKey },
      {
        tenantId,
        createdBy: input.userId,
        generatedBy: input.userId,
        type: "Daily Digest",
        status: "Generated",
        name: `Daily Digest - ${periodKey}`,
        periodKey,
        periodStart: new Date(`${periodKey}T00:00:00.000Z`),
        periodEnd: new Date(`${periodKey}T23:59:59.999Z`),
        generatedAt: new Date(),
        summaryText,
        metrics,
        recommendations,
        data: metrics,
        deliveryStatus: "Not Sent",
        idempotencyKey,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await incrementUsage({ tenantId, metric: "reportsGeneratedThisMonth", amount: 1 });

    let deliveryStatus: "Not Sent" | "Queued" | "Sent" | "Failed" = "Not Sent";
    if (input.send) {
      const delivery = await sendReportDelivery({ tenantId, reportId: String(report._id), operationId });
      deliveryStatus = delivery.deliveryStatus;
    }

    await createAutomationLog({
      tenantId,
      moduleKey: "daily-digest",
      moduleName: "Daily Digest",
      status: "Success",
      message: "Daily digest generated",
      relatedRecordType: "Report",
      relatedRecordId: String(report._id),
      operationId,
      idempotencyKey,
    });

    return {
      operationId,
      tenantId,
      reportId: String(report._id),
      type: "Daily Digest",
      status: input.send ? "Sent" : "Generated",
      periodKey,
      metrics,
      summaryText,
      deliveryStatus,
    };
  } catch (error) {
    await createAutomationLog({
      tenantId,
      moduleKey: "daily-digest",
      moduleName: "Daily Digest",
      status: "Failed",
      message: "Daily digest generation failed",
      operationId,
      idempotencyKey,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function generateWeeklyReport(input: {
  tenantId: string;
  userId: string;
  weekStart?: string;
  weekEnd?: string;
  send?: boolean;
  force?: boolean;
  operationId?: string;
}): Promise<ReportGenerationResult> {
  const tenantId = assertTenantId(input.tenantId);
  const operationId = input.operationId ?? randomUUID();
  const defaultWeek = getWeekBoundaries();
  const weekStart = input.weekStart ? new Date(input.weekStart) : defaultWeek.weekStart;
  const weekEnd = input.weekEnd ? new Date(input.weekEnd) : defaultWeek.weekEnd;
  const periodKey = `${formatDate(weekStart)}_to_${formatDate(weekEnd)}`;
  const idempotencyKey = `weekly-report:${tenantId}:${periodKey}`;

  const existing = await getReportByPeriod({ tenantId, type: "Weekly Performance", periodKey });
  if (existing && !input.force) {
    return {
      operationId,
      tenantId,
      reportId: String(existing._id),
      type: existing.type,
      status: existing.status,
      periodKey,
      metrics: (existing.metrics as WeeklyPerformanceMetrics) ?? (existing.data as WeeklyPerformanceMetrics),
      summaryText: existing.summaryText ?? "",
      deliveryStatus: (existing.deliveryStatus as "Not Sent" | "Queued" | "Sent" | "Failed") ?? "Not Sent",
    };
  }

  await createAutomationLog({
    tenantId,
    moduleKey: "weekly-report",
    moduleName: "Weekly Report",
    status: "Running",
    message: "Weekly report generation started",
    operationId,
    idempotencyKey,
  });

  try {
    await assertCanGenerateReport(tenantId);
    const metrics = await getWeeklyPerformanceMetrics({ tenantId, weekStart, weekEnd });
    const summaryText = summaryForWeekly(metrics);
    const report = await ReportModel.findOneAndUpdate(
      { tenantId, type: "Weekly Performance", periodKey },
      {
        tenantId,
        createdBy: input.userId,
        generatedBy: input.userId,
        type: "Weekly Performance",
        status: "Generated",
        name: `Weekly Performance - ${periodKey}`,
        periodKey,
        periodStart: weekStart,
        periodEnd: weekEnd,
        generatedAt: new Date(),
        summaryText,
        metrics,
        recommendations: metrics.recommendations,
        data: metrics,
        deliveryStatus: "Not Sent",
        idempotencyKey,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await incrementUsage({ tenantId, metric: "reportsGeneratedThisMonth", amount: 1 });

    let deliveryStatus: "Not Sent" | "Queued" | "Sent" | "Failed" = "Not Sent";
    if (input.send) {
      const delivery = await sendReportDelivery({ tenantId, reportId: String(report._id), operationId });
      deliveryStatus = delivery.deliveryStatus;
    }

    await createAutomationLog({
      tenantId,
      moduleKey: "weekly-report",
      moduleName: "Weekly Report",
      status: "Success",
      message: "Weekly report generated",
      relatedRecordType: "Report",
      relatedRecordId: String(report._id),
      operationId,
      idempotencyKey,
    });

    return {
      operationId,
      tenantId,
      reportId: String(report._id),
      type: "Weekly Performance",
      status: input.send ? "Sent" : "Generated",
      periodKey,
      metrics,
      summaryText,
      deliveryStatus,
    };
  } catch (error) {
    await createAutomationLog({
      tenantId,
      moduleKey: "weekly-report",
      moduleName: "Weekly Report",
      status: "Failed",
      message: "Weekly report generation failed",
      operationId,
      idempotencyKey,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function sendReportTest(input: {
  tenantId: string;
  reportId: string;
  userId: string;
  to?: string;
  operationId?: string;
}): Promise<ReportDeliveryResult> {
  const tenantId = assertTenantId(input.tenantId);
  const operationId = input.operationId ?? randomUUID();
  const report = await findTenantScopedById(ReportModel, tenantId, input.reportId);
  if (!report) throw new ApiError("Report not found", 404, "NOT_FOUND");
  const idempotencyKey = `report-send-test:${tenantId}:${input.reportId}:${input.to ?? "default"}`;

  await createAutomationLog({
    tenantId,
    moduleKey: report.type === "Daily Digest" ? "daily-digest" : "weekly-report",
    moduleName: "Report Delivery",
    status: "Running",
    message: "Report test send started",
    relatedRecordType: "Report",
    relatedRecordId: input.reportId,
    operationId,
    idempotencyKey,
  });

  try {
    const result = await sendReportDelivery({ tenantId, reportId: input.reportId, to: input.to, operationId });
    await createAutomationLog({
      tenantId,
      moduleKey: report.type === "Daily Digest" ? "daily-digest" : "weekly-report",
      moduleName: "Report Delivery",
      status: "Success",
      message: "Report test send completed",
      relatedRecordType: "Report",
      relatedRecordId: input.reportId,
      operationId,
      idempotencyKey,
      metadata: { deliveryId: result.deliveryId },
    });
    return result;
  } catch (error) {
    await ReportModel.findByIdAndUpdate(report._id, {
      deliveryStatus: "Failed",
      deliveryError: error instanceof Error ? error.message : "Unknown error",
    });
    await createAutomationLog({
      tenantId,
      moduleKey: report.type === "Daily Digest" ? "daily-digest" : "weekly-report",
      moduleName: "Report Delivery",
      status: "Failed",
      message: "Report test send failed",
      relatedRecordType: "Report",
      relatedRecordId: input.reportId,
      operationId,
      idempotencyKey,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
