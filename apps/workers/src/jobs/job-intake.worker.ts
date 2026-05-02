import type { JobIntakeEmailPayload } from "@shared/types/job";
import { processJobIntakeProcessor } from "../processors/job-intake.processor";

export async function processJobIntakeJob(input: {
  tenantId: string;
  userId: string;
  payload: JobIntakeEmailPayload;
  correlationId?: string;
}) {
  // TODO: route this payload through BullMQ/Redis when queue infra is ready.
  return processJobIntakeProcessor(input);
}
