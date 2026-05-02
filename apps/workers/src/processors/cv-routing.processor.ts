export type CvRoutingPayload = {
  tenantId: string;
  documentId: string;
  jobId: string;
  userId: string;
  operationId?: string;
};

export async function processCvRoutingJob(payload: CvRoutingPayload) {
  // TODO: Replace with BullMQ/Redis queue processor and API transport.
  return {
    queued: true,
    moduleKey: "cv-routing",
    operationId: payload.operationId ?? `cv-routing-${Date.now()}`,
    payload,
  };
}
