import { ApplicationModel, AutomationLogModel, UserModel } from "@jobflow/database/models";
import { sendResendEmail, isResendConfigured } from "@jobflow/integrations/email/resend.service";
import { notifyAutomationEvent } from "../lib/notifications";
import { logger } from "../utils/logger";

async function findOwnerEmail(tenantId: string): Promise<string | null> {
  try {
    const owner = await UserModel.findOne({ tenantId, role: "Owner" }).select("email").lean() as { email?: string } | null;
    return owner?.email ?? null;
  } catch {
    return null;
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
  const operationId = payload.operationId ?? `follow-up-reminder-${Date.now()}`;
  const now = payload.now ? new Date(payload.now) : new Date();
  const tenantId = payload.tenantId;

  logger.info({ tenantId, operationId, now: now.toISOString() }, "follow-up reminder sweep started");

  const ownerEmail = await findOwnerEmail(tenantId);
  const canSendEmail = Boolean(ownerEmail && isResendConfigured());

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const dueItems = await ApplicationModel.find({
      tenantId,
      applicationStatus: { $in: ["Applied", "Follow-Up Due"] },
      responseStatus: { $in: ["No Response", "Needs Review"] },
      followUpStatus: { $in: ["Scheduled", "Due Today", "Overdue"] },
      followUpDate: { $lte: now },
    })
      .sort({ followUpDate: 1 })
      .limit(100);

    processed = dueItems.length;
    logger.info({ tenantId, operationId, count: processed }, "follow-up items found");

    for (const application of dueItems) {
      const followUpDateKey = application.followUpDate
        ? application.followUpDate.toISOString().slice(0, 10)
        : "none";
      const reminderKey = `follow-up:${tenantId}:${String(application._id)}:${followUpDateKey}`;
      const alreadySent = application.followUpStatus === "Sent";
      const duplicateReminder = application.followUpReminderKey === reminderKey;

      if (alreadySent || duplicateReminder) {
        skipped += 1;
        continue;
      }

      try {
        const message =
          application.followUpMessagePreview ??
          `Follow-up reminder: ${application.company} — ${application.position} (applied ${application.dateApplied?.toDateString() ?? "recently"})`;

        if (canSendEmail && ownerEmail) {
          const html = [
            `<h3>Follow-up Reminder</h3>`,
            `<p><strong>${application.company}</strong> — ${application.position}</p>`,
            `<p>${message}</p>`,
            application.followUpDate
              ? `<p>Due: ${application.followUpDate.toLocaleDateString()}</p>`
              : "",
          ].join("");

          const emailResult = await sendResendEmail({
            to: ownerEmail,
            subject: `Follow-up reminder: ${application.company} — ${application.position}`,
            html,
            text: message,
          });

          if (!emailResult.success) {
            logger.warn(
              { tenantId, operationId, applicationId: String(application._id), error: emailResult.message },
              "resend delivery failed for follow-up reminder"
            );
          }
        }

        await ApplicationModel.findByIdAndUpdate(application._id, {
          followUpStatus: "Sent",
          reminderSentDate: now,
          followUpReminderSentAt: now,
          followUpReminderKey: reminderKey,
          followUpReminderLastCheckedAt: now,
        });
        sent += 1;
      } catch (error) {
        failed += 1;
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.warn({ tenantId, operationId, applicationId: String(application._id), error: msg }, "follow-up item failed");
        await ApplicationModel.findByIdAndUpdate(application._id, {
          followUpReminderLastCheckedAt: now,
          followUpReminderError: msg,
        });
      }
    }

    const durationMs = Date.now() - started;
    const status = failed > 0 ? "Warning" : "Success";
    const summary = `Follow-up sweep: ${processed} found, ${sent} sent, ${skipped} skipped, ${failed} failed`;

    await writeLog({ tenantId, status, message: summary, operationId, metadata: { processed, sent, skipped, failed, durationMs, emailEnabled: canSendEmail } });

    if (sent > 0) {
      await notifyAutomationEvent({
        tenantId,
        moduleKey: "follow-up-reminder",
        event: "follow-up-due",
        message: `⏰ ${sent} follow-up reminder${sent !== 1 ? "s" : ""} sent. ${skipped} skipped, ${failed} failed.`,
        operationId,
        metadata: { sent, skipped, failed, durationMs },
      });
    }

    logger.info({ tenantId, operationId, processed, sent, skipped, failed, durationMs }, "follow-up reminder sweep completed");

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
    logger.error({ tenantId, operationId, error: msg }, "follow-up reminder sweep failed");
    await writeLog({ tenantId, status: "Failed", message: `Sweep failed: ${msg}`, operationId });
    throw error;
  }
}
