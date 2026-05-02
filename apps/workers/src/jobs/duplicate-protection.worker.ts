import { processDuplicateProtectionProcessor } from "../processors/duplicate-protection.processor";

export async function processDuplicateProtectionJob(input: {
  tenantId: string;
  jobId: string;
  correlationId?: string;
}) {
  // TODO: route this payload through BullMQ/Redis when queue infra is ready.
  return processDuplicateProtectionProcessor(input);
}
