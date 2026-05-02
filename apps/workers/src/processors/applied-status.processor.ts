export async function processAppliedStatusJob(payload: {
  tenantId: string;
  applicationId: string;
  userId: string;
  operationId?: string;
}) {
  // TODO: Replace with BullMQ/Redis queue processor.
  return {
    queued: true,
    moduleKey: "applied-status",
    operationId: payload.operationId ?? `applied-status-${Date.now()}`,
    payload,
  };
}
