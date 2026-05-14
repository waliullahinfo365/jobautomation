import { ApplicationModel, AutomationLogModel, JobModel } from "@jobflow/database/models";
import { notifyAutomationEvent } from "../lib/notifications";
import { logger } from "../utils/logger";

type IssueSeverity = "info" | "warning" | "critical";

interface LifecycleIssue {
  recordType: "Job" | "Application";
  recordId: string;
  severity: IssueSeverity;
  issueType: string;
  message: string;
  recommendedAction: string;
}

function daysAgo(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - days);
  return r;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

async function writeLog(input: {
  tenantId: string;
  status: "Success" | "Warning" | "Failed";
  message: string;
  operationId: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await AutomationLogModel.create({
      tenantId: input.tenantId,
      createdBy: "system",
      moduleKey: "lifecycle-monitoring",
      moduleName: "Lifecycle Monitoring",
      status: input.status,
      message: input.message,
      operationId: input.operationId,
      metadata: input.metadata ?? {},
    });
  } catch (e) {
    logger.error({ err: e }, "failed to write lifecycle-monitoring automation log");
  }
}

export async function processLifecycleMonitoringJob(payload: {
  tenantId: string;
  operationId?: string;
  date?: string;
}) {
  const started = Date.now();
  const operationId = payload.operationId ?? `lifecycle-monitoring-${Date.now()}`;
  const tenantId = payload.tenantId;
  const now = payload.date ? new Date(payload.date) : new Date();

  logger.info({ tenantId, operationId }, "lifecycle monitoring sweep started");

  const issues: LifecycleIssue[] = [];

  try {
    // ── 1. Stale New jobs: no research/draft after 7 days
    const staleNew = await JobModel.find({
      tenantId,
      status: "New",
      researchGenerated: { $ne: true },
      draftGenerated: { $ne: true },
      createdAt: { $lte: daysAgo(now, 7) },
    }).select("_id company position createdAt").limit(50).lean() as Array<Record<string, unknown>>;

    for (const job of staleNew) {
      const age = daysBetween(new Date(String(job.createdAt)), now);
      issues.push({
        recordType: "Job",
        recordId: String(job._id),
        severity: age > 14 ? "critical" : "warning",
        issueType: "stale-new-job",
        message: `${job.company} — ${job.position} has been New for ${age} days with no research or draft.`,
        recommendedAction: "Run AI research and generate cover letter draft.",
      });
    }

    // ── 2. Draft generated but not applied after 5 days
    const staleDrafts = await JobModel.find({
      tenantId,
      draftGenerated: true,
      status: { $in: ["Drafting", "Ready to Apply"] },
      lastAiRunAt: { $lte: daysAgo(now, 5) },
    }).select("_id company position lastAiRunAt status").limit(50).lean() as Array<Record<string, unknown>>;

    for (const job of staleDrafts) {
      const age = daysBetween(new Date(String(job.lastAiRunAt ?? job.createdAt ?? now)), now);
      issues.push({
        recordType: "Job",
        recordId: String(job._id),
        severity: age > 10 ? "critical" : "warning",
        issueType: "draft-not-applied",
        message: `${job.company} — ${job.position} has a draft but hasn't been applied in ${age} days.`,
        recommendedAction: "Submit application or update status to Rejected/Archived.",
      });
    }

    // ── 3. Applied jobs with no reply after 14 days
    const noReply = await ApplicationModel.find({
      tenantId,
      applicationStatus: "Applied",
      responseStatus: "No Response",
      dateApplied: { $lte: daysAgo(now, 14) },
    }).select("_id company position dateApplied followUpStatus").limit(50).lean() as Array<Record<string, unknown>>;

    for (const app of noReply) {
      const age = daysBetween(new Date(String(app.dateApplied)), now);
      const needsFollowUp = app.followUpStatus === "Not Needed";
      issues.push({
        recordType: "Application",
        recordId: String(app._id),
        severity: age > 30 ? "critical" : "info",
        issueType: "no-reply-after-apply",
        message: `${app.company} — ${app.position} applied ${age} days ago with no reply.`,
        recommendedAction: needsFollowUp
          ? "Schedule a follow-up or mark as No Response."
          : "Send a follow-up email to the recruiter.",
      });
    }

    // ── 4. Follow-up overdue (scheduled but not sent)
    const overdueFollowUp = await ApplicationModel.find({
      tenantId,
      followUpStatus: { $in: ["Scheduled", "Due Today", "Overdue"] },
      followUpDate: { $lte: daysAgo(now, 1) },
    }).select("_id company position followUpDate").limit(50).lean() as Array<Record<string, unknown>>;

    for (const app of overdueFollowUp) {
      const age = daysBetween(new Date(String(app.followUpDate)), now);
      issues.push({
        recordType: "Application",
        recordId: String(app._id),
        severity: age > 3 ? "critical" : "warning",
        issueType: "overdue-follow-up",
        message: `${app.company} — ${app.position} follow-up is ${age} day${age !== 1 ? "s" : ""} overdue.`,
        recommendedAction: "Send follow-up email or mark as complete.",
      });
    }

    // ── 5. Interview scheduled but aiProcessingStatus not completed
    const interviewNeedingPrep = await JobModel.find({
      tenantId,
      status: "Interview",
      $or: [{ researchGenerated: { $ne: true } }, { draftGenerated: { $ne: true } }],
    }).select("_id company position").limit(20).lean() as Array<Record<string, unknown>>;

    for (const job of interviewNeedingPrep) {
      issues.push({
        recordType: "Job",
        recordId: String(job._id),
        severity: "warning",
        issueType: "interview-no-prep",
        message: `${job.company} — ${job.position} is at Interview stage but AI research/draft not generated.`,
        recommendedAction: "Generate research and cover letter for interview preparation.",
      });
    }

    const durationMs = Date.now() - started;

    const criticalCount = issues.filter((i) => i.severity === "critical").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;

    const status = criticalCount > 0 ? "Warning" : "Success";
    const summary = `Lifecycle scan: ${issues.length} issue${issues.length !== 1 ? "s" : ""} found (${criticalCount} critical, ${warningCount} warning).`;

    await writeLog({
      tenantId,
      status,
      message: summary,
      operationId,
      metadata: {
        total: issues.length,
        critical: criticalCount,
        warning: warningCount,
        info: issues.filter((i) => i.severity === "info").length,
        issues: issues.slice(0, 20), // store first 20 for reference
        durationMs,
      },
    });

    if (criticalCount > 0) {
      await notifyAutomationEvent({
        tenantId,
        moduleKey: "lifecycle-monitoring",
        event: "daily-digest",
        message: `📊 Pipeline health: ${criticalCount} critical, ${warningCount} warning issues need attention.`,
        operationId,
        metadata: { total: issues.length, critical: criticalCount, warning: warningCount, durationMs },
      });
    }

    logger.info({ tenantId, operationId, total: issues.length, critical: criticalCount, warning: warningCount, durationMs }, "lifecycle monitoring sweep completed");

    return {
      moduleKey: "lifecycle-monitoring",
      operationId,
      status: criticalCount > 0 ? "warning" : "completed",
      issues: issues.length,
      critical: criticalCount,
      warning: warningCount,
      durationMs,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error({ tenantId, operationId, error: msg }, "lifecycle monitoring sweep failed");
    await writeLog({ tenantId, status: "Failed", message: `Sweep failed: ${msg}`, operationId });
    throw error;
  }
}
