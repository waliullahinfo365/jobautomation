import { processWorkerWeeklyReport } from "./report-generation.worker";

export type WeeklyReportPayload = {
  tenantId: string;
  userId: string;
  weekStart?: string;
  weekEnd?: string;
  send?: boolean;
  force?: boolean;
  to?: string;
  operationId?: string;
};

export async function processWeeklyReportJob(payload: WeeklyReportPayload) {
  return processWorkerWeeklyReport(payload);
}
