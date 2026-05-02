import { randomUUID } from "node:crypto";
import { ApplicationModel } from "@database/models";
import { sendFollowUpReminderStub } from "@integrations/smtp/smtp.service";
import type { FollowUpReminderResult } from "@shared/types/application";
import { createAutomationLog } from "./automation-log.service";
import { assertTenantId, findTenantScopedById } from "./baseTenant.service";
import { ApiError } from "../utils/errors";

export async function scheduleFollowUp(input: {
  tenantId: string;
  applicationId: string;
  userId: string;
  followUpDate: Date;
  message?: string;
}) {
  const tenantId = assertTenantId(input.tenantId);
  const application = await findTenantScopedById(ApplicationModel, tenantId, input.applicationId);
  if (!application) throw new ApiError("Application not found", 404, "NOT_FOUND");

  const updated = await ApplicationModel.findOneAndUpdate(
    { _id: input.applicationId, tenantId },
    {
      followUpDate: input.followUpDate,
      followUpStatus: "Scheduled",
      followUpMessagePreview: input.message,
      followUpReminderLastCheckedAt: new Date(),
      updatedBy: input.userId,
    },
    { new: true }
  );
  return updated;
}

export async function markFollowUpSent(input: {
  tenantId: string;
  applicationId: string;
  userId: string;
  sentAt?: Date;
}) {
  const tenantId = assertTenantId(input.tenantId);
  const sentAt = input.sentAt ?? new Date();
  const updated = await ApplicationModel.findOneAndUpdate(
    { _id: input.applicationId, tenantId },
    {
      followUpStatus: "Sent",
      reminderSentDate: sentAt,
      followUpReminderSentAt: sentAt,
      followUpReminderLastCheckedAt: new Date(),
      updatedBy: input.userId,
    },
    { new: true }
  );
  if (!updated) throw new ApiError("Application not found", 404, "NOT_FOUND");
  return updated;
}

export async function findDueFollowUps(input: { tenantId: string; now?: Date; limit?: number }) {
  const tenantId = assertTenantId(input.tenantId);
  const now = input.now ?? new Date();
  return ApplicationModel.find({
    tenantId,
    applicationStatus: { $in: ["Applied", "Follow-Up Due"] },
    responseStatus: { $in: ["No Response", "Needs Review"] },
    followUpStatus: { $in: ["Scheduled", "Due Today", "Overdue"] },
    followUpDate: { $lte: now },
  })
    .sort({ followUpDate: 1 })
    .limit(input.limit ?? 50);
}

export async function processDueFollowUpsForTenant(input: {
  tenantId: string;
  operationId?: string;
  now?: Date;
}) {
  const tenantId = assertTenantId(input.tenantId);
  const operationId = input.operationId ?? randomUUID();
  const now = input.now ?? new Date();
  const dueItems = await findDueFollowUps({ tenantId, now, limit: 100 });
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const application of dueItems) {
    const followUpDateKey = application.followUpDate ? application.followUpDate.toISOString().slice(0, 10) : "none";
    const reminderKey = `follow-up:${tenantId}:${String(application._id)}:${followUpDateKey}`;
    const alreadySent = application.followUpStatus === "Sent";
    const duplicateReminder = application.followUpReminderKey === reminderKey;

    if (alreadySent || duplicateReminder) {
      skipped += 1;
      continue;
    }

    try {
      await sendFollowUpReminderStub({
        tenantId,
        applicationId: String(application._id),
        to: application.contactEmail ?? "no-reply@example.com",
        subject: `Follow-up reminder: ${application.company} - ${application.position}`,
        bodyText:
          application.followUpMessagePreview ??
          `This is your scheduled follow-up reminder for ${application.company} (${application.position}).`,
      });

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
      await ApplicationModel.findByIdAndUpdate(application._id, {
        followUpReminderLastCheckedAt: now,
        followUpReminderError: error instanceof Error ? error.message : "Unknown follow-up error",
      });
    }
  }

  await createAutomationLog({
    tenantId,
    moduleKey: "follow-up-reminder",
    moduleName: "Follow-Up Reminder",
    status: failed > 0 ? "Warning" : "Success",
    message: "Processed due follow-ups",
    operationId,
    metadata: { total: dueItems.length, sent, skipped, failed },
  });

  return { operationId, processed: dueItems.length, sent, skipped, failed };
}

export function toFollowUpReminderResult(input: {
  operationId: string;
  tenantId: string;
  applicationId: string;
  status: "scheduled" | "sent" | "skipped" | "failed";
  followUpDate?: Date;
  message: string;
}): FollowUpReminderResult {
  return {
    operationId: input.operationId,
    tenantId: input.tenantId,
    applicationId: input.applicationId,
    status: input.status,
    followUpDate: input.followUpDate?.toISOString(),
    message: input.message,
  };
}
