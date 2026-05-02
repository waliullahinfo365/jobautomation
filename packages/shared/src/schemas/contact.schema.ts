import { z } from "zod";
import { contactRelationships, followUpStatuses } from "../constants/statuses";
export const contactCreateSchema = z.object({ tenantId: z.string().min(1), createdBy: z.string().min(1), name: z.string().min(1), relationship: z.enum(contactRelationships), email: z.string().email().optional(), followUpStatus: z.enum(followUpStatuses).default("Not Needed") });
export const contactUpdateSchema = contactCreateSchema.partial();
