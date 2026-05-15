import {
  AutomationLogModel,
  JobModel,
  NotificationModel,
  TenantModel,
  UserModel,
} from "@jobflow/database/models";
import { sendResendEmail, isResendConfigured } from "@jobflow/integrations/email/resend.service";
import {
  callAnthropicMessages,
  buildAnthropicModelCandidates,
  resolveAnthropicApiKey,
} from "@jobflow/integrations/ai/anthropic-messages";
import { notifyAutomationEvent } from "../lib/notifications";
import { logger } from "../utils/logger";

// Statuses that mean a job is no longer active and should not be alerted on.
const INACTIVE_STATUSES = ["Rejected", "Archived", "Offer"] as const;

// Default alert window when not set in tenant settings or env.
const DEFAULT_ALERT_WINDOW_DAYS = 3;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function daysUntil(deadline: Date, now: Date): number {
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyLabel(days: number): string {
  if (days <= 0) return "TODAY — past due";
  if (days === 1) return "TOMORROW";
  return `in ${days} day${days !== 1 ? "s" : ""}`;
}

function urgencyEmoji(days: number): string {
  if (days <= 0) return "🚨";
  if (days <= 1) return "⚠️";
  return "📅";
}

/** Resolve the alert window from tenant settings, then env, then default. */
async function resolveAlertWindowDays(tenantId: string): Promise<number> {
  try {
    const tenant = (await TenantModel.findOne({ _id: tenantId })
      .select("settings")
      .lean()) as { settings?: Record<string, unknown> } | null;
    const s = tenant?.settings as
      | { deadlineAlert?: { warnBeforeDays?: number } }
      | undefined;
    const fromSettings = s?.deadlineAlert?.warnBeforeDays;
    if (typeof fromSettings === "number" && fromSettings > 0) return fromSettings;
  } catch {
    // fall through
  }
  const fromEnv = Number(process.env.DEADLINE_ALERT_WINDOW_DAYS ?? "");
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_ALERT_WINDOW_DAYS;
}

/**
 * Build per-job alert content.
 * Uses Anthropic when configured; otherwise uses a deterministic template.
 * Template output is never labelled as AI-generated.
 */
async function buildAlertContent(job: {
  company: string;
  position: string;
  deadline: Date;
  jobUrl?: string | null;
  status: string;
  now: Date;
}): Promise<{ subject: string; text: string; html: string; suggestedAction: string; aiGenerated: boolean }> {
  const { company, position, deadline, jobUrl, status, now } = job;
  const days = daysUntil(deadline, now);
  const urgency = urgencyLabel(days);
  const emoji = urgencyEmoji(days);
  const deadlineStr = formatDateLong(deadline);

  const apiKey = resolveAnthropicApiKey();
  if (apiKey) {
    const prompt = [
      "You are a job-search assistant. Write a concise deadline alert for the user about their own job application pipeline.",
      "This alert is for the user, NOT a message to the recruiter.",
      "",
      `Company: ${company}`,
      `Role: ${position}`,
      `Application deadline: ${deadlineStr} (${urgency})`,
      `Current status: ${status}`,
      jobUrl ? `Job URL: ${jobUrl}` : "",
      "",
      "Return ONLY a JSON object (no markdown, no code fences) with keys:",
      '  "subject": string (email subject ≤90 chars, include company and days)',
      '  "text": string (plain text body, 2–4 sentences)',
      '  "html": string (same as text but with <p> tags)',
      '  "suggestedAction": string (one concrete action the user should take right now, ≤120 chars)',
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const result = await callAnthropicMessages({
        prompt,
        apiKey,
        modelCandidates: buildAnthropicModelCandidates(),
        maxTokens: 500,
        temperature: 0.3,
      });

      if (result.ok) {
        const cleaned = result.text
          .replace(/^```(?:json)?/i, "")
          .replace(/```$/, "")
          .trim();
        const parsed = JSON.parse(cleaned) as {
          subject?: string;
          text?: string;
          html?: string;
          suggestedAction?: string;
        };
        if (parsed.subject && parsed.text && parsed.html && parsed.suggestedAction) {
          return {
            subject: parsed.subject,
            text: parsed.text,
            html: parsed.html,
            suggestedAction: parsed.suggestedAction,
            aiGenerated: true,
          };
        }
      }
    } catch {
      // fall through to template
    }
  }

  // Deterministic template — not labelled as AI.
  const suggestedAction =
    status === "Applied" || status === "Interview"
      ? `Follow up with the hiring team before the deadline on ${deadlineStr}.`
      : `Complete and submit your application for ${company} before ${deadlineStr}.`;

  const subject = `${emoji} Deadline alert: ${company} — ${position} (${urgency})`;
  const text = [
    `Your deadline for ${company} (${position}) is approaching: ${deadlineStr} (${urgency}).`,
    `Current status: ${status}.`,
    suggestedAction,
    jobUrl ? `Job listing: ${jobUrl}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const html = [
    `<h3>${emoji} Deadline Alert</h3>`,
    `<p><strong>${company}</strong> — ${position}</p>`,
    `<p>Deadline: <strong>${deadlineStr}</strong> (${urgency})</p>`,
    `<p>Status: ${status}</p>`,
    `<p><strong>Suggested action:</strong> ${suggestedAction}</p>`,
    jobUrl ? `<p><a href="${jobUrl}">View job listing →</a></p>` : "",
  ]
    .filter(Boolean)
    .join("");

  return { subject, text, html, suggestedAction, aiGenerated: false };
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

  logger.info(
    { tenantId, operationId, now: now.toISOString() },
    "deadline alert sweep started"
  );

  try {
    const [alertWindowDays, owner] = await Promise.all([
      resolveAlertWindowDays(tenantId),
      UserModel.findOne({ tenantId, role: "Owner" })
        .select("email name")
        .lean() as Promise<{ email?: string; name?: string } | null>,
    ]);

    const windowEnd = addDays(now, alertWindowDays);
    const ownerEmail = owner?.email ?? null;
    const canSendEmail = Boolean(ownerEmail && isResendConfigured());

    logger.info(
      { tenantId, operationId, alertWindowDays, windowEnd: windowEnd.toISOString() },
      "deadline alert window resolved"
    );

    // Query active jobs whose deadline falls within the alert window.
    // Exclude already-processed jobs whose alertKey matches today (idempotent).
    const today = now.toISOString().slice(0, 10);
    const alertKeyForToday = (jobId: string) =>
      `deadline-alert:${tenantId}:${jobId}:${today}`;

    const candidates = await JobModel.find({
      tenantId,
      deadline: { $gte: now, $lte: windowEnd },
      status: { $nin: INACTIVE_STATUSES },
    })
      .select(
        "company position deadline jobUrl status deadlineAlertKey deadlineAlertSentAt"
      )
      .sort({ deadline: 1 })
      .limit(50)
      .lean() as Array<Record<string, unknown>>;

    logger.info(
      { tenantId, operationId, count: candidates.length },
      "deadline candidates found"
    );

    // Filter out jobs already alerted today.
    const dueJobs = candidates.filter((job) => {
      const expectedKey = alertKeyForToday(String(job._id));
      return job.deadlineAlertKey !== expectedKey;
    });

    const scanned = candidates.length;
    const skipped = scanned - dueJobs.length;

    if (dueJobs.length === 0) {
      await writeLog({
        tenantId,
        status: "Success",
        message: `No new deadline alerts needed. ${scanned} scanned, ${skipped} already sent.`,
        operationId,
        metadata: { scanned, skipped, alerted: 0, windowDays: alertWindowDays },
      });
      logger.info({ tenantId, operationId, scanned, skipped }, "no new deadline alerts");
      return {
        moduleKey: "deadline-alert",
        operationId,
        status: "completed",
        scanned,
        skipped,
        alerted: 0,
        failed: 0,
      };
    }

    let alerted = 0;
    let failed = 0;

    for (const job of dueJobs) {
      const jobId = String(job._id);
      const deadline = new Date(String(job.deadline));
      const company = String(job.company ?? "Unknown");
      const position = String(job.position ?? "Unknown");
      const jobUrl = job.jobUrl ? String(job.jobUrl) : null;
      const status = String(job.status ?? "Unknown");
      const alertKey = alertKeyForToday(jobId);

      try {
        const content = await buildAlertContent({
          company,
          position,
          deadline,
          jobUrl,
          status,
          now,
        });

        // ── 1. Resend email to tenant owner ────────────────────────────
        if (canSendEmail && ownerEmail) {
          const emailResult = await sendResendEmail({
            to: ownerEmail,
            subject: content.subject,
            html: content.html,
            text: content.text,
          });
          if (!emailResult.success) {
            logger.warn(
              { tenantId, operationId, jobId, error: emailResult.message },
              "resend delivery failed for deadline alert"
            );
          }
        }

        // ── 2. Dashboard bell notification ─────────────────────────────
        const days = daysUntil(deadline, now);
        await NotificationModel.create({
          tenantId,
          createdBy: "system",
          updatedBy: "system",
          title: `Deadline ${days <= 0 ? "past due" : `in ${days} day${days !== 1 ? "s" : ""}`}: ${company}`,
          body: `${position} — ${content.suggestedAction.slice(0, 200)}`,
          severity: days <= 1 ? "warning" : "info",
          moduleKey: "deadline-alert",
          relatedRecordType: "Job",
          relatedRecordId: jobId,
          actionUrl: `/jobs/${jobId}`,
          metadata: {
            operationId,
            alertKey,
            company,
            position,
            deadline: deadline.toISOString(),
            daysUntilDeadline: days,
            suggestedAction: content.suggestedAction,
            aiGenerated: content.aiGenerated,
          },
          readUserIds: [],
        });

        // ── 3. Persist alert fields on Job ─────────────────────────────
        await JobModel.findByIdAndUpdate(jobId, {
          deadlineAlertSentAt: now,
          deadlineAlertKey: alertKey,
          $unset: { deadlineAlertError: "" },
        });

        alerted += 1;
        logger.info(
          {
            tenantId,
            operationId,
            jobId,
            company,
            position,
            daysUntilDeadline: days,
            aiGenerated: content.aiGenerated,
          },
          "deadline alert sent"
        );
      } catch (error) {
        failed += 1;
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.warn(
          { tenantId, operationId, jobId, company, position, error: msg },
          "deadline alert failed for job"
        );
        await JobModel.findByIdAndUpdate(jobId, { deadlineAlertError: msg }).catch(
          () => undefined
        );
      }
    }

    const durationMs = Date.now() - started;

    // ── 4. Telegram / Slack batch notification ─────────────────────────
    if (alerted > 0) {
      const jobList = dueJobs
        .slice(0, alerted)
        .map((j) => `${j.company} — ${j.position}`)
        .join(", ");
      await notifyAutomationEvent({
        tenantId,
        moduleKey: "deadline-alert",
        event: "deadline-due",
        message: `⏳ *Deadline Alert* — ${alerted} job${alerted !== 1 ? "s" : ""} due soon: ${jobList}`,
        operationId,
        metadata: { scanned, alerted, skipped, failed, windowDays: alertWindowDays, durationMs },
      });
    }

    await writeLog({
      tenantId,
      status: failed > 0 ? "Warning" : "Success",
      message: `Deadline sweep: ${scanned} scanned, ${alerted} alerted, ${skipped} already sent, ${failed} failed.`,
      operationId,
      metadata: {
        scanned,
        alerted,
        skipped,
        failed,
        windowDays: alertWindowDays,
        durationMs,
        emailEnabled: canSendEmail,
        aiEnabled: Boolean(resolveAnthropicApiKey()),
      },
    });

    logger.info(
      { tenantId, operationId, scanned, alerted, skipped, failed, durationMs },
      "deadline alert sweep completed"
    );

    return {
      moduleKey: "deadline-alert",
      operationId,
      status: failed > 0 ? "warning" : "completed",
      scanned,
      alerted,
      skipped,
      failed,
      durationMs,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error({ tenantId, operationId, error: msg }, "deadline alert sweep fatal error");
    await writeLog({
      tenantId,
      status: "Failed",
      message: `Sweep failed: ${msg}`,
      operationId,
    });
    throw error;
  }
}
