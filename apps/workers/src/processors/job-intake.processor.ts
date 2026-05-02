import type { JobIntakeEmailPayload } from "@shared/types/job";

export type JobIntakeProcessorPayload = {
  tenantId: string;
  userId: string;
  payload: JobIntakeEmailPayload;
  correlationId?: string;
};

export async function processJobIntakeProcessor(payload: JobIntakeProcessorPayload) {
  // TODO: Replace with BullMQ/Redis queue processor and API transport.
  return {
    queued: true,
    moduleKey: "job-intake",
    operationId: `job-intake-${Date.now()}`,
    payload,
  };
}
