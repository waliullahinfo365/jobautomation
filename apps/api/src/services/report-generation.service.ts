import { randomUUID } from "node:crypto";
import { IntegrationConnectionModel, ReportModel } from "@jobflow/database/models";
import { deliverReportNotifications } from "@jobflow/integrations/notifications/report-delivery";
import type {
  DailyDigestMetrics,
  ReportDeliveryResult,
  ReportGenerationResult,
  ReportProviderResults,
  WeeklyPerformanceMetrics,
} from "@jobflow/shared/types/report";
import { createAutomationLog } from "./automation-log.service";
import { assertTenantId, findTenantScopedById } from "./baseTenant.service";
import { getDailyDigestMetrics, getWeeklyPerformanceMetrics } from "./report-analytics.service";
import { ApiError } from "../utils/errors";
import { assertCanGenerateReport } from "./plan-limit.service";
import { incrementUsage } from "./usage.service";
import { createUserNotification } from "./in-app-notification.service";

function deliveryChannelPartialFailure(pr: ReportProviderResults): boolean {
  return (
    (pr.telegram.configured && pr.telegram.attempted && !pr.telegram.success) ||
    (pr.slack.configured && pr.slack.attempted && !pr.slack.success) ||
    (pr.email.configured && pr.email.attempted && !pr.email.success)
  );
}

function buildExternalDeliverySentToLabels(
  delivery: { telegram: { success: boolean }; slack: { success: boolean }; email: { success: boolean } },
  emailAddress?: string
): string[] {
  const labels: string[] = [];
  if (delivery.telegram.success) labels.push("Telegram chat");
  if (delivery.slack.success) labels.push("Slack channel");
  if (delivery.email.success) labels.push(emailAddress?.trim() ? emailAddress.trim() : "Email");
  return labels;
}

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

/** User-facing suffix when Google Doc/Drive/Gmail delivery was skipped (never logs secrets). */
function googleDeliveryMessageSuffix(data: Record<string, unknown>): string | undefined {
  const gd = data.googleDelivery;
  if (!gd || typeof gd !== "object") return undefined;
  const g = gd as Record<string, unknown>;
  if (g.success === true && g.fallbackUsed !== true) return undefined;

  const reconnect = g.reconnectRequired === true ? " Reconnect Google Drive in Settings." : "";
  const endpointType = typeof g.endpointType === "string" ? g.endpointType : "";
  const requiredScope = typeof g.requiredScope === "string" ? g.requiredScope : "";

  if (g.googleDocsApiNotEnabled === true) {
    return "Google Docs API must be enabled in Google Cloud Console (APIs & Services → Library).";
  }

  if (g.googleDocsScopeMissing === true) {
    return `Reconnect required — Google Docs scope missing.${reconnect}`;
  }

  if (endpointType === "oauth.precondition") {
    const base =
      typeof g.googleErrorMessage === "string" && g.googleErrorMessage.trim()
        ? g.googleErrorMessage.trim()
        : requiredScope
          ? `Missing OAuth scope: ${requiredScope}`
          : "Google OAuth precondition failed.";
    return `${base}${reconnect}`;
  }

  if (
    endpointType === "docs.documents.batchUpdate" ||
    requiredScope.includes("documents") ||
    endpointType.includes("documents")
  ) {
    return `Reconnect required — Google Docs scope missing or Docs API not enabled.${reconnect}`;
  }

  if (
    endpointType.startsWith("gmail.") ||
    requiredScope.includes("gmail.send") ||
    requiredScope.includes("/auth/gmail")
  ) {
    return `Gmail send scope missing. Reconnect Gmail integration.${reconnect}`;
  }

  if (endpointType.startsWith("drive.") || requiredScope.includes("drive")) {
    return `Google Drive write failed or scope insufficient. Reconnect Google Drive integration.${reconnect}`;
  }

  const code = typeof g.statusCode === "number" ? g.statusCode : 0;
  const brief =
    typeof g.googleErrorMessage === "string"
      ? g.googleErrorMessage.slice(0, 220)
      : typeof g.googleErrorReason === "string"
        ? g.googleErrorReason
        : "Google API delivery skipped.";
  return code === 403 ? `Google delivery failed (403): ${brief}.${reconnect}` : `${brief}${reconnect}`;
}

async function isSmtpIntegrationConnected(tenantId: string): Promise<boolean> {
  const conn = await IntegrationConnectionModel.findOne({ tenantId, provider: "SMTP", status: "Connected" }).select("_id").lean();
  return Boolean(conn);
}

async function sendReportDelivery(input: { tenantId: string; reportId: string; to?: string | string[]; operationId: string }): Promise<ReportDeliveryResult> {
  const report = await findTenantScopedById(ReportModel, input.tenantId, input.reportId);
  if (!report) throw new ApiError("Report not found", 404, "NOT_FOUND");

  await ReportModel.findByIdAndUpdate(report._id, { deliveryStatus: "Queued", deliveryError: undefined });

  const data = (report.data && typeof report.data === "object" ? report.data : {}) as Record<string, unknown>;
  const markdown = typeof data.markdown === "string" ? data.markdown : String(report.summaryText ?? "");
  const detailUrl = typeof data.googleDocUrl === "string" ? data.googleDocUrl : undefined;
  const smtpOk = await isSmtpIntegrationConnected(input.tenantId);
  const toRaw = Array.isArray(input.to) ? input.to[0] : input.to;

  const reportType = report.type as "Daily Digest" | "Weekly Performance" | "PDF Export" | "Manual Report";
  const event = report.type === "Daily Digest" ? ("daily-digest" as const) : ("weekly-report" as const);

  const delivery = await deliverReportNotifications({
    tenantId: input.tenantId,
    title: report.name,
    summaryText: markdown || String(report.summaryText ?? ""),
    detailUrl,
    reportType,
    event,
    smtpIntegrationConnected: smtpOk,
    email: smtpOk && toRaw ? { to: toRaw, html: `<pre>${markdown}</pre>`, text: markdown } : undefined,
  });

  const providerResults = {
    telegram: delivery.telegram,
    slack: delivery.slack,
    email: delivery.email,
  };

  const previewOnly = !delivery.anySent;
  const methods = [delivery.telegram.success ? "telegram" : null, delivery.slack.success ? "slack" : null, delivery.email.success ? "email" : null].filter(
    Boolean
  ) as string[];

  const providerTyped = providerResults as ReportProviderResults;
  const channelWarn = !previewOnly && deliveryChannelPartialFailure(providerTyped);
  const googleWarnLegacy = Boolean(googleDeliveryMessageSuffix(data));
  const deliveryWarning = channelWarn || googleWarnLegacy || Boolean(data.deliveryWarning);

  let deliveryOutcome: string;
  if (previewOnly) deliveryOutcome = "Not delivered";
  else if (deliveryWarning) deliveryOutcome = "Delivery warning";
  else deliveryOutcome = "Delivered";

  const sentToLabels = delivery.anySent ? buildExternalDeliverySentToLabels(delivery, toRaw ? String(toRaw) : undefined) : [];

  const googleSuffix = googleDeliveryMessageSuffix(data);
  const baseMessage = previewOnly
    ? "No Telegram, Slack, or SMTP channel delivered successfully; report remains available in the dashboard."
    : "Report delivery attempted on configured channels.";
  const message = googleSuffix ? `${baseMessage} ${googleSuffix}` : baseMessage;

  await ReportModel.findByIdAndUpdate(report._id, {
    deliveryStatus: delivery.anySent ? "Sent" : "Not Sent",
    deliveryError: previewOnly ? "No notification provider delivered successfully." : undefined,
    deliveryMethod: delivery.anySent ? (methods.length ? methods.join("+") : "dashboard") : "dashboard-preview",
    sentAt: delivery.anySent ? new Date() : undefined,
    sentTo: sentToLabels,
    status: delivery.anySent ? "Sent" : report.status,
    data: {
      ...data,
      providerResults,
      lastDeliveryAt: new Date().toISOString(),
      previewOnly,
      deliveryChannelWarning: channelWarn,
      deliveryWarning,
      deliveryOutcome,
    },
  });

  return {
    operationId: input.operationId,
    tenantId: input.tenantId,
    reportId: input.reportId,
    deliveryStatus: delivery.anySent ? "Sent" : "Not Sent",
    message,
    providerResults,
    previewOnly,
    deliveryOutcome,
    deliveryWarning,
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

function moduleKeyForReportType(type: string): string {
  if (type === "Daily Digest") return "daily-digest";
  if (type === "Weekly Performance") return "weekly-report";
  return "report-generation";
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
  const mk = moduleKeyForReportType(report.type);

  await createAutomationLog({
    tenantId,
    moduleKey: mk,
    moduleName: mk,
    status: "Running",
    message: "Report test send started",
    relatedRecordType: "Report",
    relatedRecordId: input.reportId,
    operationId,
    idempotencyKey,
  });

  try {
    const result = await sendReportDelivery({ tenantId, reportId: input.reportId, to: input.to, operationId });
    const channelWarn =
      !result.previewOnly &&
      Boolean(result.providerResults && deliveryChannelPartialFailure(result.providerResults as ReportProviderResults));

    await createAutomationLog({
      tenantId,
      moduleKey: "report-delivery",
      moduleName: "Report delivery",
      status: result.previewOnly ? "Warning" : channelWarn ? "Warning" : "Success",
      message: result.previewOnly
        ? "Report send test warning: no notification provider delivered successfully."
        : channelWarn
          ? "Report send test completed with delivery warnings on one or more channels."
          : "Report test send completed",
      relatedRecordType: "Report",
      relatedRecordId: input.reportId,
      operationId,
      idempotencyKey,
      metadata: {
        providerResults: result.providerResults,
        previewOnly: result.previewOnly,
        sourceModule: mk,
        telegram: result.providerResults?.telegram,
        slack: result.providerResults?.slack,
        email: result.providerResults?.email,
        reportId: input.reportId,
        deliveryOutcome: result.deliveryOutcome,
        deliveryWarning: result.deliveryWarning,
      },
    });

    await createUserNotification({
      tenantId,
      userId: input.userId,
      title: result.previewOnly || channelWarn ? "Report delivery warning" : "Report delivery completed",
      message: result.message.slice(0, 900),
      type: result.previewOnly || channelWarn ? "warning" : "success",
      module: "report-delivery",
      relatedRecordType: "Report",
      relatedRecordId: input.reportId,
      actionUrl: "/reports",
      metadata: {
        previewOnly: result.previewOnly,
        channelWarn,
        deliveryOutcome: result.deliveryOutcome,
      },
    });

    return result;
  } catch (error) {
    await ReportModel.findByIdAndUpdate(report._id, {
      deliveryStatus: "Failed",
      deliveryError: error instanceof Error ? error.message : "Unknown error",
    });
    await createAutomationLog({
      tenantId,
      moduleKey: "report-delivery",
      moduleName: "Report delivery",
      status: "Failed",
      message: "Report test send failed",
      relatedRecordType: "Report",
      relatedRecordId: input.reportId,
      operationId,
      idempotencyKey,
      error: error instanceof Error ? error.message : "Unknown error",
      metadata: { sourceModule: mk, reportId: input.reportId },
    });
    throw error;
  }
}
