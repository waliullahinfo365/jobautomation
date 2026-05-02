import { z } from "zod";
import { interviewStatuses, interviewTypes, prepStatuses } from "../constants/statuses";
export const interviewCreateSchema = z.object({ tenantId: z.string().min(1), createdBy: z.string().min(1), company: z.string().min(1), position: z.string().min(1), interviewType: z.enum(interviewTypes), status: z.enum(interviewStatuses).default("Scheduled"), dateTime: z.string().datetime(), prepStatus: z.enum(prepStatuses).default("Not Started") });
export const interviewUpdateSchema = interviewCreateSchema.partial();
