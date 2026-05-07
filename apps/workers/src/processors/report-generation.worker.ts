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
import { sendReportEmailStub } from "@jobflow/integrations/smtp/smtp.service";
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
  const webhook = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!webhook) {
    await AutomationLogModel.create({
      tenantId: input.tenantId,
      createdBy: "system",
      moduleKey: input.event,
      moduleName: input.event,
      status: "Warning",
      message: "Slack notification skipped: SLACK_WEBHOOK_URL not configured",
      metadata: { provider: "slack" },
    });
    return;
  }
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: input.message }),
  });
  if (!response.ok) {
    await AutomationLogModel.create({
      tenantId: input.tenantId,
      createdBy: "system",
      moduleKey: input.event,
      moduleName: input.event,
      status: "Warning",
      message: `Slack webhook failed (${response.status})`,
      metadata: { provider: "slack" },
    });
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

    const smtpReady = await isSmtpConfigured(payload.tenantId);
    if (payload.send) {
      if (smtpReady) {
        const delivered = await sendReportEmailStub({
          to: payload.to ?? "reports@example.local",
          subject: title,
          html: `<pre>${generated.body}</pre>`,
          text: generated.body,
          reportType: "Daily Digest",
        });
        await ReportModel.findByIdAndUpdate(report._id, {
          status: "Sent",
          deliveryStatus: "Sent",
          deliveryMethod: "smtp",
          sentAt: new Date(delivered.sentAt),
          sentTo: [payload.to ?? "reports@example.local"],
          deliveryId: delivered.deliveryId,
          deliveryError: undefined,
        });
        await createLog({
          tenantId: payload.tenantId,
          moduleKey: "daily-digest",
          status: "Success",
          message: "Daily digest test sent",
          operationId,
          relatedRecordId: String(report._id),
        });
      } else {
        await createLog({
          tenantId: payload.tenantId,
          moduleKey: "daily-digest",
          status: "Warning",
          message: "SMTP not configured; daily digest test email preview generated.",
          operationId,
          relatedRecordId: String(report._id),
          metadata: { smtpConfigured: false },
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
      message: payload.send
        ? smtpReady
          ? "Daily digest generated and test sent."
          : "SMTP not configured; daily digest preview generated."
        : "Daily digest generated.",
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

    const smtpReady = await isSmtpConfigured(payload.tenantId);
    if (payload.send) {
      if (smtpReady) {
        const delivered = await sendReportEmailStub({
          to: payload.to ?? "reports@example.local",
          subject: title,
          html: `<pre>${generated.body}</pre>`,
          text: generated.body,
          reportType: "Weekly Performance",
        });
        await ReportModel.findByIdAndUpdate(report._id, {
          status: "Sent",
          deliveryStatus: "Sent",
          deliveryMethod: "smtp",
          sentAt: new Date(delivered.sentAt),
          sentTo: [payload.to ?? "reports@example.local"],
          deliveryId: delivered.deliveryId,
          deliveryError: undefined,
        });
        await createLog({
          tenantId: payload.tenantId,
          moduleKey: "weekly-report",
          status: "Success",
          message: "Weekly report test sent",
          operationId,
          relatedRecordId: String(report._id),
        });
      } else {
        await createLog({
          tenantId: payload.tenantId,
          moduleKey: "weekly-report",
          status: "Warning",
          message: "SMTP not configured; weekly report test email preview generated.",
          operationId,
          relatedRecordId: String(report._id),
          metadata: { smtpConfigured: false },
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
      message: payload.send
        ? smtpReady
          ? "Weekly report generated and test sent."
          : "SMTP not configured; weekly report preview generated."
        : "Weekly report generated.",
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
    throw error;
  }
}

