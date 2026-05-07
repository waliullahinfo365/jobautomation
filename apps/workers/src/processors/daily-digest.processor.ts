import { processWorkerDailyDigest } from "./report-generation.worker";

export type DailyDigestPayload = {
  tenantId: string;
  userId: string;
  date?: string;
  send?: boolean;
  force?: boolean;
  to?: string;
  operationId?: string;
};

export async function processDailyDigestJob(payload: DailyDigestPayload) {
  return processWorkerDailyDigest(payload);
}
