import {
  ApplicationModel,
  AutomationLogModel,
  NotificationModel,
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

// Application statuses that are still active and can need follow-ups.
// Excludes: Drafted, Ready (not yet applied), Rejected, Archived (closed), Offer (done).
const ACTIVE_STATUSES = ["Applied", "Follow-Up Due", "Interview", "Replied"] as const;

// followUpStatus values that mean "already handled" — skip these.
const SKIP_FOLLOW_UP_STATUSES = new Set(["Sent", "Not Needed"]);

async function findOwnerEmail(tenantId: string): Promise<string | null> {
  try {
    const owner = (await UserModel.findOne({ tenantId, role: "Owner" })
      .select("email")
      .lean()) as { email?: string } | null;
    return owner?.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Build reminder message text for a single application.
 * Uses Anthropic when configured; falls back to a deterministic template.
 * Never labels template output as AI-generated.
 */
async function buildReminderContent(application: {
  company: string;
  position: string;
  applicationStatus: string;
  responseStatus?: string;
  followUpDate?: Date | null;
  dateApplied?: Date | null;
  notes?: string | null;
  followUpMessagePreview?: string | null;
}): Promise<{ subject: string; text: string; html: string; aiGenerated: boolean }> {
  const company = application.company;
  const position = application.position;
  const appliedOn = application.dateApplied
    ? application.dateApplied.toDateString()
    : "recently";
  const dueOn = application.followUpDate
    ? application.followUpDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "today";
  const status = application.applicationStatus;
  const responseStatus = application.responseStatus ?? "No Response";

  const apiKey = resolveAnthropicApiKey();
  if (apiKey) {
    const prompt = [
      "You are a job-search assistant. Write a concise follow-up reminder message for the user (not for the recruiter).",
      "The user applied for a role and has not yet followed up. Remind them to do so.",
      "",
      `Company: ${company}`,
      `Position: ${position}`,
      `Applied: ${appliedOn}`,
      `Current status: ${status}`,
      `Response status: ${responseStatus}`,
      `Follow-up due: ${dueOn}`,
      application.notes ? `Notes: ${application.notes}` : "",
      "",
      "Return ONLY a JSON object (no markdown, no code fences) with keys:",
      '  "subject": string (email subject line, ≤90 chars)',
      '  "text": string (plain text body, 2–4 sentences)',
      '  "html": string (same content as HTML, use <p> tags)',
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const result = await callAnthropicMessages({
        prompt,
        apiKey,
        modelCandidates: buildAnthropicModelCandidates(),
        maxTokens: 400,
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
        };
        if (parsed.subject && parsed.text && parsed.html) {
          return {
            subject: parsed.subject,
            text: parsed.text,
            html: parsed.html,
            aiGenerated: true,
          };
        }
      }
    } catch {
      // fall through to template
    }
  }

  // Deterministic template — not labelled as AI.
  const subject = `Follow-up reminder: ${company} — ${position}`;
  const text =
    application.followUpMessagePreview ??
    `Your follow-up for ${company} (${position}) is due on ${dueOn}. ` +
      `You applied ${appliedOn} and the current status is ${status}. ` +
      `Consider sending a follow-up message to the hiring team.`;
  const html = [
    `<h3>Follow-up Reminder</h3>`,
    `<p><strong>${company}</strong> — ${position}</p>`,
    `<p><strong>Status:</strong> ${status} &nbsp;|&nbsp; <strong>Due:</strong> ${dueOn}</p>`,
    `<p>${text}</p>`,
  ].join("");

  return { subject, text, html, aiGenerated: false };
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
      moduleKey: "follow-up-reminder",
      moduleName: "Follow-Up Reminder",
      status: input.status,
      message: input.message,
      operationId: input.operationId,
      metadata: input.metadata ?? {},
    });
  } catch (e) {
    logger.error({ err: e }, "failed to write follow-up-reminder automation log");
  }
}

export async function processFollowUpReminderJob(payload: {
  tenantId: string;
  operationId?: string;
  now?: string;
}) {
  const started = Date.now();
  const operationId =
    payload.operationId ?? `follow-up-reminder-${Date.now()}`;
  const now = payload.now ? new Date(payload.now) : new Date();
  const tenantId = payload.tenantId;

  logger.info(
    { tenantId, operationId, now: now.toISOString() },
    "follow-up reminder sweep started"
  );

  const ownerEmail = await findOwnerEmail(tenantId);
  const canSendEmail = Boolean(ownerEmail && isResendConfigured());

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // Query all active applications whose follow-up date has passed
    // and that haven't already been reminded for this due date.
    const dueItems = await ApplicationModel.find({
      tenantId,
      applicationStatus: { $in: ACTIVE_STATUSES },
      followUpDate: { $lte: now },
      followUpStatus: { $nin: Array.from(SKIP_FOLLOW_UP_STATUSES) },
    })
      .sort({ followUpDate: 1 })
      .limit(100);

    processed = dueItems.length;
    logger.info(
      { tenantId, operationId, count: processed },
      "follow-up items found"
    );

    for (const application of dueItems) {
      const applicationId = String(application._id);
      const followUpDateKey = application.followUpDate
        ? application.followUpDate.toISOString().slice(0, 10)
        : "none";
      // Idempotency: one reminder per (application, due-date).
      const reminderKey = `follow-up:${tenantId}:${applicationId}:${followUpDateKey}`;

      if (application.followUpReminderKey === reminderKey) {
        skipped += 1;
        logger.debug(
          { tenantId, operationId, applicationId, reminderKey },
          "follow-up already sent for this due date — skipping"
        );
        continue;
      }

      try {
        const content = await buildReminderContent({
          company: application.company,
          position: application.position,
          applicationStatus: application.applicationStatus,
          responseStatus: application.responseStatus ?? undefined,
          followUpDate: application.followUpDate ?? null,
          dateApplied: application.dateApplied ?? null,
          notes: application.notes ?? null,
          followUpMessagePreview: application.followUpMessagePreview ?? null,
        });

        // ── 1. Resend email to tenant owner ──────────────────────────────
        if (canSendEmail && ownerEmail) {
          const emailResult = await sendResendEmail({
            to: ownerEmail,
            subject: content.subject,
            html: content.html,
            text: content.text,
          });

          if (!emailResult.success) {
            logger.warn(
              {
                tenantId,
                operationId,
                applicationId,
                error: emailResult.message,
              },
              "resend delivery failed for follow-up reminder"
            );
          }
        }

        // ── 2. Dashboard bell notification ───────────────────────────────
        await NotificationModel.create({
          tenantId,
          createdBy: "system",
          updatedBy: "system",
          title: `Follow-up due: ${application.company}`,
          body: `${application.position} — ${content.text.slice(0, 200)}`,
          severity: "info",
          moduleKey: "follow-up-reminder",
          relatedRecordType: "Application",
          relatedRecordId: applicationId,
          actionUrl: "/applications",
          metadata: {
            operationId,
            reminderKey,
            company: application.company,
            position: application.position,
            followUpDate: followUpDateKey,
            aiGenerated: content.aiGenerated,
          },
          readUserIds: [],
        });

        // ── 3. Persist status update on Application ───────────────────────
        await ApplicationModel.findByIdAndUpdate(application._id, {
          followUpStatus: "Sent",
          reminderSentDate: now,
          followUpReminderSentAt: now,
          followUpReminderKey: reminderKey,
          followUpReminderLastCheckedAt: now,
          $unset: { followUpReminderError: "" },
        });

        sent += 1;
        logger.info(
          {
            tenantId,
            operationId,
            applicationId,
            company: application.company,
            position: application.position,
            aiGenerated: content.aiGenerated,
          },
          "follow-up reminder sent"
        );
      } catch (error) {
        failed += 1;
        const msg =
          error instanceof Error ? error.message : "Unknown error";
        logger.warn(
          { tenantId, operationId, applicationId, error: msg },
          "follow-up reminder item failed"
        );
        await ApplicationModel.findByIdAndUpdate(application._id, {
          followUpReminderLastCheckedAt: now,
          followUpReminderError: msg,
        });
      }
    }

    const durationMs = Date.now() - started;
    const sweepStatus = failed > 0 ? "Warning" : "Success";
    const summary = `Follow-up sweep: ${processed} found, ${sent} sent, ${skipped} skipped, ${failed} failed`;

    await writeLog({
      tenantId,
      status: sweepStatus,
      message: summary,
      operationId,
      metadata: {
        processed,
        sent,
        skipped,
        failed,
        durationMs,
        emailEnabled: canSendEmail,
        aiEnabled: Boolean(resolveAnthropicApiKey()),
      },
    });

    // ── 4. Telegram / Slack batch notification ────────────────────────────
    if (sent > 0) {
      await notifyAutomationEvent({
        tenantId,
        moduleKey: "follow-up-reminder",
        event: "follow-up-due",
        message: `⏰ *Follow-up Reminders* — ${sent} sent, ${skipped} already sent, ${failed} failed.`,
        operationId,
        metadata: { processed, sent, skipped, failed, durationMs },
      });
    }

    logger.info(
      { tenantId, operationId, processed, sent, skipped, failed, durationMs },
      "follow-up reminder sweep completed"
    );

    return {
      moduleKey: "follow-up-reminder",
      operationId,
      status: failed > 0 ? "warning" : "completed",
      processed,
      sent,
      skipped,
      failed,
      durationMs,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { tenantId, operationId, error: msg },
      "follow-up reminder sweep fatal error"
    );
    await writeLog({
      tenantId,
      status: "Failed",
      message: `Sweep failed: ${msg}`,
      operationId,
    });
    throw error;
  }
}
