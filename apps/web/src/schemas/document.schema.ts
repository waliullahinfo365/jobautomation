import { z } from "zod";
import { DOCUMENT_STATUSES, DOCUMENT_TYPES } from "@/config/statuses";

export const documentSchema = z.object({
  name:           z.string().min(1),
  type:           z.enum(DOCUMENT_TYPES),
  status:         z.enum(DOCUMENT_STATUSES).default("Draft"),
  jobId:          z.string().optional(),
  applicationId:  z.string().optional(),
  content:        z.string().optional(),
  generatedByAI:  z.boolean().default(false),
});

export type DocumentSchemaInput = z.infer<typeof documentSchema>;
