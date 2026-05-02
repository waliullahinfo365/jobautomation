import { z } from "zod";
import { APPLICATION_STATUSES } from "@/config/statuses";

export const applicationSchema = z.object({
  jobId:       z.string().min(1),
  status:      z.enum(APPLICATION_STATUSES).default("Pending"),
  appliedAt:   z.string().datetime({ offset: true }).optional(),
  cvVersion:   z.string().optional(),
  coverLetter: z.string().optional(),
  notes:       z.string().optional(),
});

export type ApplicationSchemaInput = z.infer<typeof applicationSchema>;
