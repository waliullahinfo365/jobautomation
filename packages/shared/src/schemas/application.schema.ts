import { z } from "zod";
import { applicationStatuses, followUpStatuses, responseStatuses } from "../constants/statuses";
export const applicationCreateSchema = z.object({ tenantId: z.string().min(1), createdBy: z.string().min(1), jobId: z.string().min(1), company: z.string().min(1), position: z.string().min(1), applicationStatus: z.enum(applicationStatuses).default("Drafted"), responseStatus: z.enum(responseStatuses).default("No Response"), followUpStatus: z.enum(followUpStatuses).default("Not Needed") });
export const applicationUpdateSchema = applicationCreateSchema.partial();
