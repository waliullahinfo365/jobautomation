export async function processFollowUpReminderJob(payload: {
  tenantId: string;
  operationId?: string;
  now?: string;
}) {
  // TODO: Replace with BullMQ/Redis queue processor.
  return {
    queued: true,
    moduleKey: "follow-up-reminder",
    operationId: payload.operationId ?? `follow-up-reminder-${Date.now()}`,
    payload,
  };
}
