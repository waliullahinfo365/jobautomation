import { z } from "zod";
import { JOB_STATUSES } from "@/config/statuses";

const salarySchema = z.object({
  min:      z.number().optional(),
  max:      z.number().optional(),
  currency: z.string().default("USD"),
});

export const jobSchema = z.object({
  title:       z.string().min(1, "Title is required").max(200),
  company:     z.string().min(1, "Company is required").max(200),
  location:    z.string().default(""),
  remote:      z.boolean().default(false),
  url:         z.string().url("Must be a valid URL").or(z.literal("")).default(""),
  description: z.string().optional(),
  salary:      salarySchema.optional(),
  status:      z.enum(JOB_STATUSES).default("New"),
  source:      z.string().default("Manual"),
  tags:        z.array(z.string()).default([]),
  deadline:    z.string().datetime({ offset: true }).optional(),
  notes:       z.string().optional(),
  contactIds:  z.array(z.string()).default([]),
});

export const updateJobSchema = jobSchema.partial();

export type JobSchemaInput   = z.infer<typeof jobSchema>;
export type UpdateJobInput   = z.infer<typeof updateJobSchema>;
