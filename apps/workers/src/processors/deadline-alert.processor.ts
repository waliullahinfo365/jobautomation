import { AutomationLogModel, JobModel, UserModel } from "@jobflow/database/models";
import { sendResendEmail, isResendConfigured } from "@jobflow/integrations/email/resend.service";
import { notifyAutomationEvent } from "../lib/notifications";
import { logger } from "../utils/logger";

const ALERT_WINDOW_DAYS = 3; // Notify when deadline is within 3 days

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
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
      moduleKey: "deadline-alert",
      moduleName: "Deadline Alert",
      status: input.status,
      message: input.message,
      operationId: input.operationId,
      metadata: input.metadata ?? {},
    });
  } catch (e) {
    logger.error({ err: e }, "failed to write deadline-alert automation log");
  }
}

export async function processDeadlineAlertJob(payload: {
  tenantId: string;
  operationId?: string;
  date?: string;
}) {
  const started = Date.now();
  const operationId = payload.operationId ?? `deadline-alert-${Date.now()}`;
  const tenantId = payload.tenantId;
  const now = payload.date ? new Date(payload.date) : new Date();
  const windowEnd = addDays(now, ALERT_WINDOW_DAYS);

  logger.info({ tenantId, operationId, now: now.toISOString(), windowEnd: windowEnd.toISOString() }, "deadline alert sweep started");

  try {
    // Resolve owner email for Resend notification
    const owner = await UserModel.findOne({ tenantId, role: "Owner" }).select("email name").lean() as { email?: string; name?: string } | null;
    const ownerEmail = owner?.email ?? null;
    const canSendEmail = Boolean(ownerEmail && isResendConfigured());

    // Find jobs with deadlines approaching within ALERT_WINDOW_DAYS
    const jobs = await JobModel.find({
      tenantId,
      deadline: { $gte: now, $lte: windowEnd },
      status: { $nin: ["Rejected", "Archived", "Offer"] },
    })
      .select("company position deadline jobUrl status rawSourceData")
      .sort({ deadline: 1 })
      .limit(50)
      .lean() as Array<Record<string, unknown>>;

    logger.info({ tenantId, operationId, count: jobs.length }, "deadline alert jobs found");

    if (jobs.length === 0) {
      await writeLog({
        tenantId,
        status: "Success",
        message: `No upcoming deadlines in the next ${ALERT_WINDOW_DAYS} days.`,
        operationId,
        metadata: { scanned: 0, alerted: 0, windowDays: ALERT_WINDOW_DAYS },
      });
      return {
        moduleKey: "deadline-alert",
        operationId,
        status: "completed",
        scanned: 0,
        alerted: 0,
      };
    }

    // Deduplicate: skip jobs that already received an alert today
    const today = now.toISOString().slice(0, 10);
    const filteredJobs: Array<Record<string, unknown>> = [];
    for (const job of jobs) {
      const raw = (job.rawSourceData ?? {}) as Record<string, unknown>;
      const lastAlertDate = String(raw.deadlineAlertSentDate ?? "");
      if (lastAlertDate === today) continue; // already alerted today
      filteredJobs.push(job);
    }

    let alerted = 0;
    let failed = 0;

    for (const job of filteredJobs) {
      try {
        const deadline = new Date(String(job.deadline));
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const urgency = daysLeft <= 1 ? "🚨 TODAY" : daysLeft <= 2 ? "⚠️ TOMORROW" : `📅 ${daysLeft} days`;
        const company = String(job.company ?? "Unknown");
        const position = String(job.position ?? "Unknown");
        const jobUrl = job.jobUrl ? String(job.jobUrl) : null;
        const subject = `Deadline alert: ${company} — ${position} (${urgency})`;
        const bodyText = `Deadline approaching for ${company} — ${position}.\nDeadline: ${formatDate(deadline)} (${urgency})\n${jobUrl ? `\nJob URL: ${jobUrl}` : ""}`;

        if (canSendEmail && ownerEmail) {
          const html = [
            `<h3>⏳ Deadline Alert</h3>`,
            `<p><strong>${company}</strong> — ${position}</p>`,
            `<p>Deadline: <strong>${formatDate(deadline)}</strong> (${urgency})</p>`,
            jobUrl ? `<p><a href="${jobUrl}">View Job</a></p>` : "",
          ].join("");

          await sendResendEmail({ to: ownerEmail, subject, html, text: bodyText });
        }

        // Mark alert sent in rawSourceData to prevent duplicates
        await JobModel.findByIdAndUpdate(job._id, {
          $set: { "rawSourceData.deadlineAlertSentDate": today },
        });

        alerted += 1;
      } catch (error) {
        failed += 1;
        logger.warn({ tenantId, operationId, jobId: String(job._id), error: error instanceof Error ? error.message : "Unknown" }, "deadline alert failed for job");
      }
    }

    const durationMs = Date.now() - started;

    // Bulk notification if any alerts were sent
    if (alerted > 0) {
      const jobList = filteredJobs.slice(0, alerted).map((j) => `${j.company} — ${j.position}`).join(", ");
      await notifyAutomationEvent({
        tenantId,
        moduleKey: "deadline-alert",
        event: "deadline-due",
        message: `⏳ ${alerted} deadline alert${alerted !== 1 ? "s" : ""} sent: ${jobList}`,
        operationId,
        metadata: { alerted, failed, windowDays: ALERT_WINDOW_DAYS, durationMs },
      });
    }

    await writeLog({
      tenantId,
      status: failed > 0 ? "Warning" : "Success",
      message: `Deadline sweep: ${jobs.length} scanned, ${alerted} alerted, ${failed} failed.`,
      operationId,
      metadata: { scanned: jobs.length, filtered: filteredJobs.length, alerted, failed, durationMs, windowDays: ALERT_WINDOW_DAYS, emailEnabled: canSendEmail },
    });

    logger.info({ tenantId, operationId, scanned: jobs.length, alerted, failed, durationMs }, "deadline alert sweep completed");

    return {
      moduleKey: "deadline-alert",
      operationId,
      status: failed > 0 ? "warning" : "completed",
      scanned: jobs.length,
      alerted,
      failed,
      durationMs,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error({ tenantId, operationId, error: msg }, "deadline alert sweep failed");
    await writeLog({ tenantId, status: "Failed", message: `Sweep failed: ${msg}`, operationId });
    throw error;
  }
}
