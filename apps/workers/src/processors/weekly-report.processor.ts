export type WeeklyReportPayload = {
  tenantId: string;
  userId: string;
  weekStart?: string;
  weekEnd?: string;
  send?: boolean;
  force?: boolean;
  operationId?: string;
};

export async function processWeeklyReportJob(payload: WeeklyReportPayload) {
  // TODO: Replace with BullMQ/Redis queue processor and API transport.
  return {
    queued: true,
    moduleKey: "weekly-report",
    operationId: payload.operationId ?? `weekly-report-${Date.now()}`,
    payload,
  };
}
