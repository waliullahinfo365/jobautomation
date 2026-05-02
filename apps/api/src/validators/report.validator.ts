import { z } from "zod";
export const reportCreateSchema=z.object({tenantId:z.string().optional(),createdBy:z.string().optional(),type:z.enum(["Daily Digest","Weekly Performance","PDF Export","Manual Report"]),status:z.enum(["Sent","Generated","Failed","Scheduled"]).default("Generated"),name:z.string().min(1),sentTo:z.array(z.string()).optional()});
export const reportUpdateSchema=reportCreateSchema.partial();
export const dailyDigestRunBodySchema = z.object({
  date: z.string().optional(),
  send: z.boolean().optional(),
  force: z.boolean().optional(),
});
export const weeklyReportRunBodySchema = z.object({
  weekStart: z.string().optional(),
  weekEnd: z.string().optional(),
  send: z.boolean().optional(),
  force: z.boolean().optional(),
});
export const reportSendTestBodySchema = z.object({
  to: z.string().optional(),
});
export const reportAnalyticsQuerySchema = z.object({
  date: z.string().optional(),
  weekStart: z.string().optional(),
  weekEnd: z.string().optional(),
});
