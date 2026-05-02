import { z } from "zod";
import { jobStatuses } from "../constants/statuses";
export const jobCreateSchema = z.object({ tenantId: z.string().min(1), createdBy: z.string().min(1), company: z.string().min(1), position: z.string().min(1), status: z.enum(jobStatuses).default("New"), priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"), jobUrl: z.string().url().optional(), deadline: z.string().datetime().optional() });
export const jobUpdateSchema = jobCreateSchema.partial();
