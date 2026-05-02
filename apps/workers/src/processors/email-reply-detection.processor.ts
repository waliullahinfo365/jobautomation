export async function processEmailReplyDetectionJob(payload: {
  tenantId: string;
  providerMessageId: string;
  providerThreadId?: string;
  from: string;
  subject: string;
  bodyText: string;
  receivedAt: string;
  operationId?: string;
}) {
  // TODO: Replace with BullMQ/Redis queue processor.
  return {
    queued: true,
    moduleKey: "email-reply-detection",
    operationId: payload.operationId ?? `email-reply-detection-${Date.now()}`,
    payload,
  };
}
