import { notifyAutomationEvent } from "../lib/notifications";

export async function processFollowUpReminderJob(payload: {
  tenantId: string;
  operationId?: string;
  now?: string;
}) {
  const operationId = payload.operationId ?? `follow-up-reminder-${Date.now()}`;
  await notifyAutomationEvent({
    tenantId: payload.tenantId,
    moduleKey: "follow-up-reminder",
    event: "follow-up-due",
    message: "⏰ Follow-up reminder sweep completed.",
    operationId,
  });
  // TODO: Replace with BullMQ/Redis queue processor.
  return {
    queued: true,
    moduleKey: "follow-up-reminder",
    operationId,
    payload,
  };
}
