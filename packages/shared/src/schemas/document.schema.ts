import { z } from "zod";
import { documentStatuses, documentTypes } from "../constants/statuses";
export const documentCreateSchema = z.object({ tenantId: z.string().min(1), createdBy: z.string().min(1), fileName: z.string().min(1), type: z.enum(documentTypes), status: z.enum(documentStatuses).default("Draft") });
export const documentUpdateSchema = documentCreateSchema.partial();
