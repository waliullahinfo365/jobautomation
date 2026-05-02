export type DailyDigestPayload = {
  tenantId: string;
  userId: string;
  date?: string;
  send?: boolean;
  force?: boolean;
  operationId?: string;
};

export async function processDailyDigestJob(payload: DailyDigestPayload) {
  // TODO: Replace with BullMQ/Redis queue processor and API transport.
  return {
    queued: true,
    moduleKey: "daily-digest",
    operationId: payload.operationId ?? `daily-digest-${Date.now()}`,
    payload,
  };
}
