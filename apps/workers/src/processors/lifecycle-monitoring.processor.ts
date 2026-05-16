import {
  ApplicationModel,
  AutomationLogModel,
  InterviewModel,
  JobModel,
  LifecycleInsightModel,
  NotificationModel,
} from "@jobflow/database/models";
import { notifyAutomationEvent } from "../lib/notifications";
import { logger } from "../utils/logger";

// ─── Types ───────────────────────────────────────────────────────────────────

type IssueSeverity = "info" | "warning" | "critical";

interface DetectedIssue {
  recordType: "Job" | "Application" | "Interview" | "System";
  recordId: string;
  severity: IssueSeverity;
  issueType: string;
  message: string;
  recommendedAction: string;
  /** `${recordType}:${recordId}:${issueType}` */
  deduplicationKey: string;
}

// ─── Configurable thresholds (env overrides, then defaults) ──────────────────

function threshold(envKey: string, defaultVal: number): number {
  const v = Number(process.env[envKey] ?? "");
  return Number.isFinite(v) && v > 0 ? v : defaultVal;
}

const THRESHOLDS = {
  staleNewJobDays: () => threshold("LIFECYCLE_STALE_NEW_DAYS", 7),
  noResearchDays: () => threshold("LIFECYCLE_NO_RESEARCH_DAYS", 7),
  noCoverLetterDays: () => threshold("LIFECYCLE_NO_COVER_LETTER_DAYS", 5),
  notAppliedDays: () => threshold("LIFECYCLE_NOT_APPLIED_DAYS", 5),
  noReplyDays: () => threshold("LIFECYCLE_NO_REPLY_DAYS", 14),
  offerNoActionDays: () => threshold("LIFECYCLE_OFFER_NO_ACTION_DAYS", 3),
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - days);
  return r;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function deduplicationKey(
  recordType: DetectedIssue["recordType"],
  recordId: string,
  issueType: string
): string {
  return `${recordType}:${recordId}:${issueType}`;
}

// ─── Rule evaluators — each returns zero or more DetectedIssue ───────────────

async function detectStaleNewJobs(tenantId: string, now: Date): Promise<DetectedIssue[]> {
  const cutoff = daysAgo(now, THRESHOLDS.staleNewJobDays());
  const jobs = await JobModel.find({
    tenantId,
    status: "New",
    researchGenerated: { $ne: true },
    createdAt: { $lte: cutoff },
  })
    .select("_id company position createdAt")
    .limit(50)
    .lean() as Array<Record<string, unknown>>;

  return jobs.map((job) => {
    const age = daysBetween(new Date(String(job.createdAt)), now);
    return {
      recordType: "Job" as const,
      recordId: String(job._id),
      severity: age > 14 ? "critical" : "warning",
      issueType: "stale-new-job",
      message: `${job.company} — ${job.position} has been New for ${age} days with no research.`,
      recommendedAction: "Run AI research to generate a company brief and cover letter draft.",
      deduplicationKey: deduplicationKey("Job", String(job._id), "stale-new-job"),
    };
  });
}

async function detectResearchButNoCoverLetter(tenantId: string, now: Date): Promise<DetectedIssue[]> {
  const cutoff = daysAgo(now, THRESHOLDS.noCoverLetterDays());
  const jobs = await JobModel.find({
    tenantId,
    researchGenerated: true,
    draftGenerated: { $ne: true },
    status: { $in: ["Research", "Drafting"] },
    lastAiRunAt: { $lte: cutoff },
  })
    .select("_id company position lastAiRunAt")
    .limit(50)
    .lean() as Array<Record<string, unknown>>;

  return jobs.map((job) => {
    const age = daysBetween(new Date(String(job.lastAiRunAt ?? now)), now);
    return {
      recordType: "Job" as const,
      recordId: String(job._id),
      severity: age > 10 ? "critical" : "warning",
      issueType: "research-no-cover-letter",
      message: `${job.company} — ${job.position} has research but no cover letter draft after ${age} days.`,
      recommendedAction: "Generate cover letter draft to progress to Ready to Apply.",
      deduplicationKey: deduplicationKey("Job", String(job._id), "research-no-cover-letter"),
    };
  });
}

async function detectDraftNotApplied(tenantId: string, now: Date): Promise<DetectedIssue[]> {
  const cutoff = daysAgo(now, THRESHOLDS.notAppliedDays());
  const jobs = await JobModel.find({
    tenantId,
    draftGenerated: true,
    status: { $in: ["Drafting", "Ready to Apply"] },
    lastAiRunAt: { $lte: cutoff },
  })
    .select("_id company position lastAiRunAt")
    .limit(50)
    .lean() as Array<Record<string, unknown>>;

  return jobs.map((job) => {
    const age = daysBetween(new Date(String(job.lastAiRunAt ?? now)), now);
    return {
      recordType: "Job" as const,
      recordId: String(job._id),
      severity: age > 10 ? "critical" : "warning",
      issueType: "draft-not-applied",
      message: `${job.company} — ${job.position} has a draft but hasn't been applied in ${age} days.`,
      recommendedAction: "Submit the application or archive this role.",
      deduplicationKey: deduplicationKey("Job", String(job._id), "draft-not-applied"),
    };
  });
}

async function detectNoReplyAfterApply(tenantId: string, now: Date): Promise<DetectedIssue[]> {
  const cutoff = daysAgo(now, THRESHOLDS.noReplyDays());
  const apps = await ApplicationModel.find({
    tenantId,
    applicationStatus: "Applied",
    responseStatus: "No Response",
    dateApplied: { $lte: cutoff },
  })
    .select("_id company position dateApplied followUpStatus")
    .limit(50)
    .lean() as Array<Record<string, unknown>>;

  return apps.map((app) => {
    const age = daysBetween(new Date(String(app.dateApplied)), now);
    const noFollowUp = app.followUpStatus === "Not Needed";
    return {
      recordType: "Application" as const,
      recordId: String(app._id),
      severity: age > 30 ? "critical" : "info",
      issueType: "no-reply-after-apply",
      message: `${app.company} — ${app.position} applied ${age} days ago with no reply.`,
      recommendedAction: noFollowUp
        ? "Schedule a follow-up or mark this application as No Response."
        : "Send a follow-up email to the recruiter.",
      deduplicationKey: deduplicationKey("Application", String(app._id), "no-reply-after-apply"),
    };
  });
}

async function detectOverdueFollowUps(tenantId: string, now: Date): Promise<DetectedIssue[]> {
  const yesterday = daysAgo(now, 1);
  const apps = await ApplicationModel.find({
    tenantId,
    followUpStatus: { $in: ["Scheduled", "Due Today", "Overdue"] },
    followUpDate: { $lte: yesterday },
  })
    .select("_id company position followUpDate")
    .limit(50)
    .lean() as Array<Record<string, unknown>>;

  return apps.map((app) => {
    const age = daysBetween(new Date(String(app.followUpDate)), now);
    return {
      recordType: "Application" as const,
      recordId: String(app._id),
      severity: age > 3 ? "critical" : "warning",
      issueType: "overdue-follow-up",
      message: `${app.company} — ${app.position} follow-up is ${age} day${age !== 1 ? "s" : ""} overdue.`,
      recommendedAction: "Send follow-up email or run the Follow-Up Reminder automation.",
      deduplicationKey: deduplicationKey("Application", String(app._id), "overdue-follow-up"),
    };
  });
}

async function detectInterviewIncompletePrep(tenantId: string, now: Date): Promise<DetectedIssue[]> {
  // Find upcoming interviews (within next 3 days) where prep checklist is not fully done.
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const interviews = await InterviewModel.find({
    tenantId,
    status: { $in: ["Scheduled", "Awaiting Confirmation", "Rescheduled"] },
    dateTime: { $gte: now, $lte: threeDaysFromNow },
  })
    .select("_id company position dateTime prepChecklist prepStatus")
    .limit(20)
    .lean() as Array<Record<string, unknown>>;

  const issues: DetectedIssue[] = [];
  for (const interview of interviews) {
    const checklist = (interview.prepChecklist ?? []) as Array<{ done?: boolean }>;
    const totalItems = checklist.length;
    const doneItems = checklist.filter((c) => c.done).length;
    const isIncomplete = totalItems === 0 || doneItems < totalItems;
    if (!isIncomplete) continue;

    const daysUntil = daysBetween(now, new Date(String(interview.dateTime)));
    issues.push({
      recordType: "Interview" as const,
      recordId: String(interview._id),
      severity: daysUntil <= 1 ? "critical" : "warning",
      issueType: "interview-prep-incomplete",
      message: `${interview.company} — ${interview.position} interview is in ${daysUntil} day${daysUntil !== 1 ? "s" : ""} with ${doneItems}/${totalItems} prep tasks complete.`,
      recommendedAction: "Complete the interview prep checklist in the Interviews tab.",
      deduplicationKey: deduplicationKey("Interview", String(interview._id), "interview-prep-incomplete"),
    });
  }

  // Also flag jobs at Interview status with no AI research
  const jobsNoPrep = await JobModel.find({
    tenantId,
    status: "Interview",
    researchGenerated: { $ne: true },
  })
    .select("_id company position")
    .limit(20)
    .lean() as Array<Record<string, unknown>>;

  for (const job of jobsNoPrep) {
    issues.push({
      recordType: "Job" as const,
      recordId: String(job._id),
      severity: "warning",
      issueType: "interview-no-research",
      message: `${job.company} — ${job.position} is at Interview stage but AI research was not generated.`,
      recommendedAction: "Run AI research to prepare talking points and company background.",
      deduplicationKey: deduplicationKey("Job", String(job._id), "interview-no-research"),
    });
  }

  return issues;
}

async function detectOfferNoAction(tenantId: string, now: Date): Promise<DetectedIssue[]> {
  const cutoff = daysAgo(now, THRESHOLDS.offerNoActionDays());
  const apps = await ApplicationModel.find({
    tenantId,
    applicationStatus: "Offer",
    lastStatusChangedAt: { $lte: cutoff },
  })
    .select("_id company position lastStatusChangedAt")
    .limit(20)
    .lean() as Array<Record<string, unknown>>;

  return apps.map((app) => {
    const age = daysBetween(new Date(String(app.lastStatusChangedAt ?? now)), now);
    return {
      recordType: "Application" as const,
      recordId: String(app._id),
      severity: age > 7 ? "critical" : "warning",
      issueType: "offer-no-action",
      message: `${app.company} — ${app.position} has an offer with no recorded action for ${age} days.`,
      recommendedAction: "Review the offer, set a decision deadline, and update the status.",
      deduplicationKey: deduplicationKey("Application", String(app._id), "offer-no-action"),
    };
  });
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

async function upsertInsights(
  tenantId: string,
  operationId: string,
  detected: DetectedIssue[]
): Promise<{ created: number; existing: number }> {
  if (detected.length === 0) return { created: 0, existing: 0 };

  const deduplicationKeys = detected.map((d) => d.deduplicationKey);
  const existing = await LifecycleInsightModel.find({
    tenantId,
    deduplicationKey: { $in: deduplicationKeys },
    status: "open",
  })
    .select("deduplicationKey")
    .lean() as unknown as Array<{ deduplicationKey: string }>;

  const existingKeys = new Set(existing.map((e) => e.deduplicationKey));

  const toCreate = detected.filter((d) => !existingKeys.has(d.deduplicationKey));
  if (toCreate.length === 0) return { created: 0, existing: existing.length };

  await LifecycleInsightModel.insertMany(
    toCreate.map((d) => ({
      tenantId,
      createdBy: "system",
      updatedBy: "system",
      recordType: d.recordType,
      recordId: d.recordId,
      severity: d.severity,
      issueType: d.issueType,
      message: d.message,
      recommendedAction: d.recommendedAction,
      status: "open",
      deduplicationKey: d.deduplicationKey,
      lastSeenOperationId: operationId,
    }))
  );

  return { created: toCreate.length, existing: existingKeys.size };
}

async function resolveStaleInsights(
  tenantId: string,
  operationId: string,
  activeDeduplicationKeys: Set<string>,
  now: Date
): Promise<number> {
  // Find all open insights for this tenant
  const openInsights = await LifecycleInsightModel.find({
    tenantId,
    status: "open",
  })
    .select("_id deduplicationKey")
    .lean() as unknown as Array<{ _id: unknown; deduplicationKey: string }>;

  const toResolve = openInsights.filter(
    (i) => !activeDeduplicationKeys.has(i.deduplicationKey)
  );
  if (toResolve.length === 0) return 0;

  const ids = toResolve.map((i) => i._id);
  await LifecycleInsightModel.updateMany(
    { _id: { $in: ids } },
    {
      status: "resolved",
      resolvedAt: now,
      resolvedReason: `Condition no longer detected in sweep ${operationId}`,
      updatedBy: "system",
    }
  );

  return toResolve.length;
}

async function createNotificationsForNew(
  tenantId: string,
  operationId: string,
  newIssues: DetectedIssue[]
): Promise<void> {
  // Only notify for warning/critical new issues, cap at 5 notifications per sweep
  const toNotify = newIssues
    .filter((i) => i.severity === "warning" || i.severity === "critical")
    .slice(0, 5);

  for (const issue of toNotify) {
    await NotificationModel.create({
      tenantId,
      createdBy: "system",
      updatedBy: "system",
      title: `Pipeline issue: ${issue.issueType.replace(/-/g, " ")}`,
      body: `${issue.message} — ${issue.recommendedAction}`.slice(0, 300),
      severity: issue.severity === "critical" ? "warning" : "info",
      moduleKey: "lifecycle-monitoring",
      relatedRecordType: issue.recordType,
      relatedRecordId: issue.recordId,
      actionUrl:
        issue.recordType === "Job"
          ? `/jobs/${issue.recordId}`
          : issue.recordType === "Interview"
            ? "/interviews"
            : "/applications",
      metadata: {
        operationId,
        issueType: issue.issueType,
        deduplicationKey: issue.deduplicationKey,
      },
      readUserIds: [],
    });
  }
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

// ─── Main processor ───────────────────────────────────────────────────────────

export async function processLifecycleMonitoringJob(payload: {
  tenantId: string;
  operationId?: string;
  date?: string;
}) {
  const started = Date.now();
  const operationId =
    payload.operationId ?? `lifecycle-monitoring-${Date.now()}`;
  const tenantId = payload.tenantId;
  const now = payload.date ? new Date(payload.date) : new Date();

  logger.info({ tenantId, operationId }, "lifecycle monitoring sweep started");

  try {
    // ── Run all rule detectors in parallel ────────────────────────────────
    const [
      staleNew,
      researchNoCover,
      draftNotApplied,
      noReply,
      overdueFollowUp,
      interviewPrep,
      offerNoAction,
    ] = await Promise.all([
      detectStaleNewJobs(tenantId, now),
      detectResearchButNoCoverLetter(tenantId, now),
      detectDraftNotApplied(tenantId, now),
      detectNoReplyAfterApply(tenantId, now),
      detectOverdueFollowUps(tenantId, now),
      detectInterviewIncompletePrep(tenantId, now),
      detectOfferNoAction(tenantId, now),
    ]);

    const allDetected: DetectedIssue[] = [
      ...staleNew,
      ...researchNoCover,
      ...draftNotApplied,
      ...noReply,
      ...overdueFollowUp,
      ...interviewPrep,
      ...offerNoAction,
    ];

    const activeKeys = new Set(allDetected.map((d) => d.deduplicationKey));

    // ── Persist new insights (deduped) ────────────────────────────────────
    const { created, existing } = await upsertInsights(tenantId, operationId, allDetected);

    // ── Resolve insights whose condition no longer applies ─────────────────
    const resolved = await resolveStaleInsights(tenantId, operationId, activeKeys, now);

    // ── Create dashboard notifications for brand-new issues only ──────────
    if (created > 0) {
      // Only notify for issues that are actually new this sweep
      const existingKeys = new Set(
        (
          await LifecycleInsightModel.find({
            tenantId,
            status: "open",
            deduplicationKey: { $in: Array.from(activeKeys) },
          })
            .select("deduplicationKey createdAt")
            .lean() as unknown as Array<{ deduplicationKey: string; createdAt: Date }>
        )
          .filter((i) => daysBetween(i.createdAt, now) > 0) // not created today
          .map((i) => i.deduplicationKey)
      );
      const newIssues = allDetected.filter((d) => !existingKeys.has(d.deduplicationKey));
      await createNotificationsForNew(tenantId, operationId, newIssues);
    }

    const durationMs = Date.now() - started;
    const criticalCount = allDetected.filter((i) => i.severity === "critical").length;
    const warningCount = allDetected.filter((i) => i.severity === "warning").length;
    const infoCount = allDetected.filter((i) => i.severity === "info").length;

    const summary = `Lifecycle scan: ${allDetected.length} issue${allDetected.length !== 1 ? "s" : ""} active (${criticalCount} critical, ${warningCount} warning, ${infoCount} info). ${created} new, ${existing} existing, ${resolved} resolved.`;

    await writeLog({
      tenantId,
      status: criticalCount > 0 ? "Warning" : "Success",
      message: summary,
      operationId,
      metadata: {
        total: allDetected.length,
        critical: criticalCount,
        warning: warningCount,
        info: infoCount,
        created,
        existing,
        resolved,
        durationMs,
        byRule: {
          staleNewJobs: staleNew.length,
          researchNoCoverLetter: researchNoCover.length,
          draftNotApplied: draftNotApplied.length,
          noReplyAfterApply: noReply.length,
          overdueFollowUps: overdueFollowUp.length,
          interviewPrepIncomplete: interviewPrep.length,
          offerNoAction: offerNoAction.length,
        },
      },
    });

    // ── Telegram/Slack summary when there are critical issues ─────────────
    if (criticalCount > 0) {
      await notifyAutomationEvent({
        tenantId,
        moduleKey: "lifecycle-monitoring",
        event: "daily-digest",
        message: `📊 *Pipeline Health* — ${criticalCount} critical, ${warningCount} warning issues. ${created} new this sweep, ${resolved} resolved.`,
        operationId,
        metadata: { total: allDetected.length, critical: criticalCount, warning: warningCount, resolved, durationMs },
      });
    }

    logger.info(
      { tenantId, operationId, total: allDetected.length, criticalCount, warningCount, created, existing, resolved, durationMs },
      "lifecycle monitoring sweep completed"
    );

    return {
      moduleKey: "lifecycle-monitoring",
      operationId,
      status: criticalCount > 0 ? "warning" : "completed",
      total: allDetected.length,
      critical: criticalCount,
      warning: warningCount,
      info: infoCount,
      created,
      existing,
      resolved,
      durationMs,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error({ tenantId, operationId, error: msg }, "lifecycle monitoring sweep fatal error");
    await writeLog({
      tenantId,
      status: "Failed",
      message: `Sweep failed: ${msg}`,
      operationId,
    });
    throw error;
  }
}
