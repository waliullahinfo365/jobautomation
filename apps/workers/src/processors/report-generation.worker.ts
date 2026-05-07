import {
  ApplicationModel,
  AutomationLogModel,
  DocumentModel,
  IntegrationConnectionModel,
  InterviewModel,
  JobModel,
  ReportModel,
} from "@jobflow/database/models";
import {
  buildAnthropicModelCandidates,
  callAnthropicMessages,
  resolveAnthropicApiKey,
} from "@jobflow/integrations/ai/anthropic-messages";
import { deliverReportNotifications } from "@jobflow/integrations/notifications/report-delivery";
import { GOOGLE_DRIVE_DOCS_WORKER_SCOPES } from "@jobflow/shared/constants/googleScopes";
import {
  GoogleApiHttpError,
  googleFailureMetaFromUnknown,
  integrationProviderForGoogleFailure,
  loadGoogleAccessToken,
  persistGoogleReconnectHint,
} from "../lib/google-auth";
import { createGoogleDoc, ensureWorkspaceFolderStructure } from "../lib/google-drive";
import { notifyAutomationEvent } from "../lib/notifications";
import { logger } from "../utils/logger";
import { redactForLog, serializeWorkerError } from "../utils/worker-error";

export type WorkerReportType = "Daily Digest" | "Weekly Performance";

type BasePayload = {
  tenantId: string;
  userId: string;
  send?: boolean;
  force?: boolean;
  operationId?: string;
  to?: string;
};

export type DailyPayload = BasePayload & { date?: string };
export type WeeklyPayload = BasePayload & { weekStart?: string; weekEnd?: string };

type Counts = {
  jobsCount: number;
  applicationsCount: number;
  interviewsCount: number;
  documentsCount: number;
  automationSuccesses: number;
  automationFailures: number;
  followUpsDue: number;
  repliesReceived: number;
  deadlinesApproaching: number;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getWeekBounds(now = new Date()): { weekStart: Date; weekEnd: Date } {
  const current = new Date(now);
  const day = current.getUTCDay() || 7;
  const weekStart = new Date(current);
  weekStart.setUTCDate(current.getUTCDate() - day + 1);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

function buildFallbackReport(type: WorkerReportType, periodLabel: string, counts: Counts): string {
  return [
    `# ${type} — ${periodLabel}`,
    "",
    "## Executive Summary",
    `- Jobs tracked: ${counts.jobsCount}`,
    `- Applications: ${counts.applicationsCount}`,
    `- Interviews: ${counts.interviewsCount}`,
    `- Follow-ups due: ${counts.followUpsDue}`,
    `- Automation failures: ${counts.automationFailures}`,
    "",
    "## Operational Health",
    `- Automation successes: ${counts.automationSuccesses}`,
    `- Automation failures: ${counts.automationFailures}`,
    `- Replies received: ${counts.repliesReceived}`,
    `- Deadlines approaching: ${counts.deadlinesApproaching}`,
    "",
    "## Recommended Actions",
    counts.automationFailures > 0
      ? "- Review failed automation runs and re-run high priority modules."
      : "- Automation health is stable. Keep current cadence.",
    counts.followUpsDue > 0
      ? "- Clear pending follow-ups due today to protect response rates."
      : "- No overdue follow-ups detected.",
  ].join("\n");
}

async function collectCounts(input: {
  tenantId: string;
  from: Date;
  to: Date;
}): Promise<Counts> {
  const [jobsCount, applicationsCount, interviewsCount, documentsCount, automationSuccesses, automationFailures, followUpsDue, repliesReceived, deadlinesApproaching] =
    await Promise.all([
      JobModel.countDocuments({ tenantId: input.tenantId }),
      ApplicationModel.countDocuments({ tenantId: input.tenantId }),
      InterviewModel.countDocuments({ tenantId: input.tenantId }),
      DocumentModel.countDocuments({ tenantId: input.tenantId }),
      AutomationLogModel.countDocuments({
        tenantId: input.tenantId,
        status: "Success",
        createdAt: { $gte: input.from, $lte: input.to },
      }),
      AutomationLogModel.countDocuments({
        tenantId: input.tenantId,
        status: "Failed",
        createdAt: { $gte: input.from, $lte: input.to },
      }),
      ApplicationModel.countDocuments({
        tenantId: input.tenantId,
        followUpDate: { $lte: input.to },
        followUpStatus: { $ne: "Sent" },
      }),
      ApplicationModel.countDocuments({
        tenantId: input.tenantId,
        $or: [
          { replyDetectedAt: { $gte: input.from, $lte: input.to } },
          { responseDetected: true, updatedAt: { $gte: input.from, $lte: input.to } },
        ],
      }),
      JobModel.countDocuments({ tenantId: input.tenantId, deadline: { $gte: input.from, $lte: input.to } }),
    ]);

  return {
    jobsCount,
    applicationsCount,
    interviewsCount,
    documentsCount,
    automationSuccesses,
    automationFailures,
    followUpsDue,
    repliesReceived,
    deadlinesApproaching,
  };
}

function buildClaudePrompt(type: WorkerReportType, periodLabel: string, counts: Counts): string {
  return [
    `Create an executive ${type.toLowerCase()} in markdown.`,
    `Period: ${periodLabel}.`,
    "Use clear sections: Executive Summary, KPIs, Risks, Recommendations.",
    "",
    "Data:",
    JSON.stringify(counts, null, 2),
  ].join("\n");
}

async function buildReportBody(input: { type: WorkerReportType; periodLabel: string; counts: Counts }) {
  const apiKey = resolveAnthropicApiKey();
  const modelCandidates = buildAnthropicModelCandidates();
  const fallback = buildFallbackReport(input.type, input.periodLabel, input.counts);

  if (!apiKey) {
    return {
      body: fallback,
      model: "fallback",
      warning: "Claude API key missing; deterministic fallback report generated.",
    };
  }

  const result = await callAnthropicMessages({
    apiKey,
    modelCandidates,
    prompt: buildClaudePrompt(input.type, input.periodLabel, input.counts),
    maxTokens: 1200,
    temperature: 0.2,
  });
  if (result.ok) {
    return { body: result.text, model: result.model };
  }
  return {
    body: fallback,
    model: "fallback",
    warning: `Claude failed: ${redactForLog(result.message, 260)}`,
  };
}

async function isSmtpConfigured(tenantId: string): Promise<boolean> {
  const conn = await IntegrationConnectionModel.findOne({
    tenantId,
    provider: "SMTP",
    status: "Connected",
  })
    .select("_id")
    .lean();
  return Boolean(conn);
}

async function upsertReport(input: {
  tenantId: string;
  userId: string;
  type: WorkerReportType;
  periodKey: string;
  periodStart: Date;
  periodEnd: Date;
  title: string;
  markdown: string;
  counts: Counts;
  operationId: string;
}) {
  const row = await ReportModel.findOneAndUpdate(
    { tenantId: input.tenantId, type: input.type, periodKey: input.periodKey },
    {
      tenantId: input.tenantId,
      createdBy: input.userId,
      generatedBy: input.userId,
      type: input.type,
      status: "Generated",
      name: input.title,
      periodKey: input.periodKey,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      generatedAt: new Date(),
      summaryText: input.markdown.slice(0, 1000),
      metrics: input.counts,
      recommendations: [],
      data: {
        counts: input.counts,
        markdown: input.markdown,
        operationId: input.operationId,
        generatedAt: new Date().toISOString(),
        source: "worker",
      },
      deliveryStatus: "Not Sent",
      deliveryMethod: "dashboard",
      idempotencyKey: `${input.type}:${input.tenantId}:${input.periodKey}`,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return row;
}

async function createLog(input: {
  tenantId: string;
  moduleKey: "daily-digest" | "weekly-report";
  status: "Success" | "Warning" | "Failed" | "Running";
  message: string;
  operationId: string;
  relatedRecordId?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}) {
  await AutomationLogModel.create({
    tenantId: input.tenantId,
    createdBy: "system",
    moduleKey: input.moduleKey,
    moduleName: input.moduleKey,
    status: input.status,
    message: input.message,
    operationId: input.operationId,
    relatedRecordType: input.relatedRecordId ? "Report" : undefined,
    relatedRecordId: input.relatedRecordId,
    metadata: input.metadata ?? {},
    error: input.error,
  });
}

async function notifyReport(input: { tenantId: string; message: string; event: "daily-digest" | "weekly-report" }) {
  await notifyAutomationEvent({
    tenantId: input.tenantId,
    moduleKey: input.event,
    event: input.event,
    message: input.message,
  });
}

type RouteReportDriveResult =
  | { ok: true; googleDocId: string; googleDocUrl: string; reportsFolderId: string }
  | {
      ok: false;
      reason: string;
      fallbackUsed: true;
      googleDelivery?: Record<string, unknown>;
    };

async function routeReportToDrive(input: {
  tenantId: string;
  title: string;
  content: string;
  category: "Daily Digests" | "Weekly Reports";
}): Promise<RouteReportDriveResult> {
  try {
    const auth = await loadGoogleAccessToken({
      tenantId: input.tenantId,
      provider: "Google Drive",
      requiredScopes: [...GOOGLE_DRIVE_DOCS_WORKER_SCOPES],
    });
    if (!auth.connected) {
      const reconnect =
        typeof auth.reason === "string" &&
        (auth.reason.includes("scope") || auth.reason.includes("Scope"));
      return {
        ok: false,
        reason: auth.reason ?? "Google Drive not connected",
        fallbackUsed: true,
        googleDelivery: {
          googleApi: true,
          provider: "Google Drive",
          endpointType: "oauth.precondition",
          httpMethod: "N/A",
          statusCode: 0,
          googleErrorMessage: auth.reason,
          reconnectRequired: reconnect,
          fallbackUsed: true,
          requiredScope: auth.reason?.includes("documents")
            ? "https://www.googleapis.com/auth/documents"
            : "https://www.googleapis.com/auth/drive.file",
        },
      };
    }
    const workspace = await ensureWorkspaceFolderStructure({
      tenantId: input.tenantId,
      accessToken: auth.accessToken,
    });
    const reportBucket = workspace.reportChildren.find((r) => r.folder.name === input.category) ?? workspace.reports;
    const doc = await createGoogleDoc({
      accessToken: auth.accessToken,
      name: input.title,
      content: input.content,
      parentId: reportBucket.folder.id,
    });
    return {
      ok: true as const,
      googleDocId: doc.id,
      googleDocUrl: doc.webViewLink ?? `https://docs.google.com/document/d/${doc.id}/edit`,
      reportsFolderId: workspace.reports.folder.id,
    };
  } catch (error) {
    if (error instanceof GoogleApiHttpError && error.meta.reconnectRequired) {
      await persistGoogleReconnectHint({
        tenantId: input.tenantId,
        provider: integrationProviderForGoogleFailure(error.meta),
        meta: {
          endpointType: error.meta.endpointType,
          statusCode: error.meta.statusCode,
          googleErrorReason: error.meta.googleErrorReason,
          requiredScope: error.meta.requiredScope,
        },
      });
    }
    const meta = googleFailureMetaFromUnknown(error, "report.routeToDrive");
    const msg = redactForLog(error instanceof Error ? error.message : String(error));
    logger.warn({ err: error, tenantId: input.tenantId }, "routeReportToDrive: dashboard fallback (Google delivery skipped)");
    return {
      ok: false,
      reason: msg,
      fallbackUsed: true,
      googleDelivery: { ...meta } as Record<string, unknown>,
    };
  }
}

export async function processWorkerDailyDigest(payload: DailyPayload) {
  const operationId = payload.operationId ?? `daily-digest-${Date.now()}`;
  const day = payload.date ? new Date(payload.date) : new Date();
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  const periodKey = isoDate(day);
  const title = `Daily Digest - ${periodKey}`;
  try {
    const counts = await collectCounts({ tenantId: payload.tenantId, from: start, to: end });
    const generated = await buildReportBody({ type: "Daily Digest", periodLabel: periodKey, counts });
    const report = await upsertReport({
      tenantId: payload.tenantId,
      userId: payload.userId,
      type: "Daily Digest",
      periodKey,
      periodStart: start,
      periodEnd: end,
      title,
      markdown: generated.body,
      counts,
      operationId,
    });
    let mergedData: Record<string, unknown> = {
      ...((report.data ?? {}) as Record<string, unknown>),
      markdown: generated.body,
    };
    const drive = await routeReportToDrive({
      tenantId: payload.tenantId,
      title,
      content: generated.body,
      category: "Daily Digests",
    });
    if (drive.ok) {
      mergedData = {
        ...mergedData,
        googleDocId: drive.googleDocId,
        googleDocUrl: drive.googleDocUrl,
        deliveryWarning: false,
        googleDelivery: { success: true, fallbackUsed: false },
      };
      await ReportModel.findByIdAndUpdate(report._id, {
        deliveryMethod: "dashboard+drive",
        data: mergedData,
      });
    } else {
      const gd = drive.googleDelivery ?? {};
      const endpointType = String((gd as { endpointType?: string }).endpointType ?? "");
      const scopeGap =
        endpointType === "docs.documents.batchUpdate" ||
        String((gd as { requiredScope?: string }).requiredScope ?? "").includes("documents");
      mergedData = {
        ...mergedData,
        deliveryWarning: true,
        googleDelivery: {
          success: false,
          fallbackUsed: true,
          ...gd,
        },
      };
      await ReportModel.findByIdAndUpdate(report._id, {
        data: mergedData,
      });
      await createLog({
        tenantId: payload.tenantId,
        moduleKey: "daily-digest",
        status: "Warning",
        message: scopeGap
          ? "Google Docs scope missing or insufficient. Reconnect Google Drive integration. Digest saved to dashboard only."
          : `Google Drive/Docs delivery skipped: ${drive.reason ?? "provider error"}`,
        operationId,
        relatedRecordId: String(report._id),
        metadata: gd,
      });
    }

    const smtpReady = await isSmtpConfigured(payload.tenantId);
    if (payload.send) {
      const prevData = mergedData;
      const docLink = typeof prevData.googleDocUrl === "string" ? prevData.googleDocUrl : undefined;
      const delivery = await deliverReportNotifications({
        tenantId: payload.tenantId,
        title,
        summaryText: generated.body,
        detailUrl: docLink,
        reportType: "Daily Digest",
        event: "daily-digest",
        smtpIntegrationConnected: smtpReady,
        email:
          smtpReady && payload.to
            ? { to: payload.to, html: `<pre>${generated.body}</pre>`, text: generated.body }
            : undefined,
      });
      const methods = [
        delivery.telegram.success ? "telegram" : null,
        delivery.slack.success ? "slack" : null,
        delivery.email.success ? "email" : null,
      ].filter(Boolean) as string[];
      await ReportModel.findByIdAndUpdate(report._id, {
        status: delivery.anySent ? "Sent" : report.status,
        deliveryStatus: delivery.anySent ? "Sent" : "Not Sent",
        deliveryMethod: delivery.anySent ? (methods.length ? methods.join("+") : "dashboard") : "dashboard-preview",
        sentAt: delivery.anySent ? new Date() : undefined,
        sentTo: delivery.anySent && payload.to ? [payload.to] : [],
        deliveryError: delivery.anySent ? undefined : "No notification provider delivered successfully.",
        data: {
          ...prevData,
          markdown: generated.body,
          providerResults: {
            telegram: delivery.telegram,
            slack: delivery.slack,
            email: delivery.email,
          },
          previewOnly: !delivery.anySent,
        },
      });
      if (!delivery.anySent) {
        await createLog({
          tenantId: payload.tenantId,
          moduleKey: "daily-digest",
          status: "Warning",
          message: "No notification provider configured. Report preview saved only.",
          operationId,
          relatedRecordId: String(report._id),
          metadata: {
            providerResults: {
              telegram: delivery.telegram,
              slack: delivery.slack,
              email: delivery.email,
            },
          },
        });
      } else {
        await createLog({
          tenantId: payload.tenantId,
          moduleKey: "daily-digest",
          status: "Success",
          message: "Daily digest test sent",
          operationId,
          relatedRecordId: String(report._id),
          metadata: {
            providerResults: {
              telegram: delivery.telegram,
              slack: delivery.slack,
              email: delivery.email,
            },
          },
        });
      }
    } else {
      await createLog({
        tenantId: payload.tenantId,
        moduleKey: "daily-digest",
        status: generated.warning ? "Warning" : "Success",
        message: generated.warning ?? "Daily digest generated",
        operationId,
        relatedRecordId: String(report._id),
      });
    }
    await notifyReport({
      tenantId: payload.tenantId,
      message: `Daily digest ready: ${title}`,
      event: "daily-digest",
    });

    return {
      suppressWorkerCompletionLog: true as const,
      moduleKey: "daily-digest",
      status: "completed",
      reportId: String(report._id),
      operationId,
      message: payload.send ? "Daily digest test processed (see provider results on report)." : "Daily digest generated.",
    };
  } catch (error) {
    const ser = serializeWorkerError(error);
    const msg = redactForLog(ser.message);
    await createLog({
      tenantId: payload.tenantId,
      moduleKey: "daily-digest",
      status: "Failed",
      message: `Daily digest failed: ${msg}`,
      operationId,
      error: msg,
    });
    await notifyAutomationEvent({
      tenantId: payload.tenantId,
      moduleKey: "daily-digest",
      event: "automation-failure",
      message: `⚠️ Automation needs attention: daily-digest failed — ${msg}`,
      operationId,
    });
    throw error;
  }
}

export async function processWorkerWeeklyReport(payload: WeeklyPayload) {
  const operationId = payload.operationId ?? `weekly-report-${Date.now()}`;
  const defaultWeek = getWeekBounds();
  const weekStart = payload.weekStart ? new Date(payload.weekStart) : defaultWeek.weekStart;
  const weekEnd = payload.weekEnd ? new Date(payload.weekEnd) : defaultWeek.weekEnd;
  const periodKey = `${isoDate(weekStart)}_to_${isoDate(weekEnd)}`;
  const title = `Weekly Report - ${isoDate(weekEnd)}`;
  try {
    const counts = await collectCounts({ tenantId: payload.tenantId, from: weekStart, to: weekEnd });
    const generated = await buildReportBody({
      type: "Weekly Performance",
      periodLabel: `${isoDate(weekStart)} to ${isoDate(weekEnd)}`,
      counts,
    });
    const report = await upsertReport({
      tenantId: payload.tenantId,
      userId: payload.userId,
      type: "Weekly Performance",
      periodKey,
      periodStart: weekStart,
      periodEnd: weekEnd,
      title,
      markdown: generated.body,
      counts,
      operationId,
    });
    let mergedData: Record<string, unknown> = {
      ...((report.data ?? {}) as Record<string, unknown>),
      markdown: generated.body,
    };
    const drive = await routeReportToDrive({
      tenantId: payload.tenantId,
      title,
      content: generated.body,
      category: "Weekly Reports",
    });
    if (drive.ok) {
      mergedData = {
        ...mergedData,
        googleDocId: drive.googleDocId,
        googleDocUrl: drive.googleDocUrl,
        deliveryWarning: false,
        googleDelivery: { success: true, fallbackUsed: false },
      };
      await ReportModel.findByIdAndUpdate(report._id, {
        deliveryMethod: "dashboard+drive",
        data: mergedData,
      });
    } else {
      const gd = drive.googleDelivery ?? {};
      const endpointType = String((gd as { endpointType?: string }).endpointType ?? "");
      const scopeGap =
        endpointType === "docs.documents.batchUpdate" ||
        String((gd as { requiredScope?: string }).requiredScope ?? "").includes("documents");
      mergedData = {
        ...mergedData,
        deliveryWarning: true,
        googleDelivery: {
          success: false,
          fallbackUsed: true,
          ...gd,
        },
      };
      await ReportModel.findByIdAndUpdate(report._id, {
        data: mergedData,
      });
      await createLog({
        tenantId: payload.tenantId,
        moduleKey: "weekly-report",
        status: "Warning",
        message: scopeGap
          ? "Google Docs scope missing or insufficient. Reconnect Google Drive integration. Report saved to dashboard only."
          : `Google Drive/Docs delivery skipped: ${drive.reason ?? "provider error"}`,
        operationId,
        relatedRecordId: String(report._id),
        metadata: gd,
      });
    }

    const smtpReady = await isSmtpConfigured(payload.tenantId);
    if (payload.send) {
      const prevData = mergedData;
      const docLink = typeof prevData.googleDocUrl === "string" ? prevData.googleDocUrl : undefined;
      const delivery = await deliverReportNotifications({
        tenantId: payload.tenantId,
        title,
        summaryText: generated.body,
        detailUrl: docLink,
        reportType: "Weekly Performance",
        event: "weekly-report",
        smtpIntegrationConnected: smtpReady,
        email:
          smtpReady && payload.to
            ? { to: payload.to, html: `<pre>${generated.body}</pre>`, text: generated.body }
            : undefined,
      });
      const methods = [
        delivery.telegram.success ? "telegram" : null,
        delivery.slack.success ? "slack" : null,
        delivery.email.success ? "email" : null,
      ].filter(Boolean) as string[];
      await ReportModel.findByIdAndUpdate(report._id, {
        status: delivery.anySent ? "Sent" : report.status,
        deliveryStatus: delivery.anySent ? "Sent" : "Not Sent",
        deliveryMethod: delivery.anySent ? (methods.length ? methods.join("+") : "dashboard") : "dashboard-preview",
        sentAt: delivery.anySent ? new Date() : undefined,
        sentTo: delivery.anySent && payload.to ? [payload.to] : [],
        deliveryError: delivery.anySent ? undefined : "No notification provider delivered successfully.",
        data: {
          ...prevData,
          markdown: generated.body,
          providerResults: {
            telegram: delivery.telegram,
            slack: delivery.slack,
            email: delivery.email,
          },
          previewOnly: !delivery.anySent,
        },
      });
      if (!delivery.anySent) {
        await createLog({
          tenantId: payload.tenantId,
          moduleKey: "weekly-report",
          status: "Warning",
          message: "No notification provider configured. Report preview saved only.",
          operationId,
          relatedRecordId: String(report._id),
          metadata: {
            providerResults: {
              telegram: delivery.telegram,
              slack: delivery.slack,
              email: delivery.email,
            },
          },
        });
      } else {
        await createLog({
          tenantId: payload.tenantId,
          moduleKey: "weekly-report",
          status: "Success",
          message: "Weekly report test sent",
          operationId,
          relatedRecordId: String(report._id),
          metadata: {
            providerResults: {
              telegram: delivery.telegram,
              slack: delivery.slack,
              email: delivery.email,
            },
          },
        });
      }
    } else {
      await createLog({
        tenantId: payload.tenantId,
        moduleKey: "weekly-report",
        status: generated.warning ? "Warning" : "Success",
        message: generated.warning ?? "Weekly report generated",
        operationId,
        relatedRecordId: String(report._id),
      });
    }
    await notifyReport({
      tenantId: payload.tenantId,
      message: `Weekly report ready: ${title}`,
      event: "weekly-report",
    });

    return {
      suppressWorkerCompletionLog: true as const,
      moduleKey: "weekly-report",
      status: "completed",
      reportId: String(report._id),
      operationId,
      message: payload.send ? "Weekly report test processed (see provider results on report)." : "Weekly report generated.",
    };
  } catch (error) {
    const ser = serializeWorkerError(error);
    const msg = redactForLog(ser.message);
    logger.error({ err: error, operationId, tenantId: payload.tenantId }, "weekly report processing failed");
    await createLog({
      tenantId: payload.tenantId,
      moduleKey: "weekly-report",
      status: "Failed",
      message: `Weekly report failed: ${msg}`,
      operationId,
      error: msg,
    });
    await notifyAutomationEvent({
      tenantId: payload.tenantId,
      moduleKey: "weekly-report",
      event: "automation-failure",
      message: `⚠️ Automation needs attention: weekly-report failed — ${msg}`,
      operationId,
    });
    throw error;
  }
}

