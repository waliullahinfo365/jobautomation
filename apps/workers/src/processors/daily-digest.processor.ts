export type DailyDigestPayload = {
  tenantId: string;
  userId: string;
  date?: string;
  send?: boolean;
  force?: boolean;
  operationId?: string;
};

export async function processDailyDigestJob(payload: DailyDigestPayload) {
  // Stub implementation: daily digest generation is queued but not yet processed by workers
  // This will be implemented with report generation and email delivery in a future release
  return {
    queued: true,
    moduleKey: "daily-digest",
    status: "not-implemented",
    operationId: payload.operationId ?? `daily-digest-${Date.now()}`,
    message: "Daily digest generation queued. Worker implementation pending.",
    payload,
  };
}
