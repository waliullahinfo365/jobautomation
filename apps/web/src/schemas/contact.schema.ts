import { z } from "zod";
import { CONTACT_TYPES } from "@/config/statuses";

export const contactSchema = z.object({
  firstName:   z.string().min(1, "First name is required"),
  lastName:    z.string().min(1, "Last name is required"),
  email:       z.string().email().optional().or(z.literal("")),
  phone:       z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  company:     z.string().optional(),
  title:       z.string().optional(),
  type:        z.enum(CONTACT_TYPES).default("Other"),
  jobIds:      z.array(z.string()).default([]),
  notes:       z.string().optional(),
  followUpDue: z.string().datetime({ offset: true }).optional(),
});

export type ContactSchemaInput = z.infer<typeof contactSchema>;
