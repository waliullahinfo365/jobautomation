import { z } from "zod";
import { reportStatuses, reportTypes } from "../constants/statuses";
export const reportSchema = z.object({
  tenantId: z.string().min(1),
  createdBy: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(reportTypes),
  status: z.enum(reportStatuses),
  periodKey: z.string().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  deliveryStatus: z.enum(["Not Sent", "Queued", "Sent", "Failed"]).optional(),
  summaryText: z.string().optional(),
  metrics: z.record(z.string(), z.unknown()).optional(),
  recommendations: z.array(z.string()).optional(),
  generatedBy: z.string().optional(),
  idempotencyKey: z.string().optional(),
});
