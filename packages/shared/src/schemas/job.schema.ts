import { z } from "zod";
import { jobStatuses } from "../constants/statuses";

const jobSources = [
  "LinkedIn",
  "Indeed",
  "Company Website",
  "Referral",
  "Gmail",
  "Manual",
  "Other",
] as const;

const optionalUrl = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().url().optional()
);

const optionalDeadline = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T12:00:00.000Z`).toISOString();
  }
  return s;
}, z.string().datetime().optional());

export const jobCreateSchema = z.object({
  tenantId: z.string().min(1),
  createdBy: z.string().min(1),
  company: z.string().min(1),
  position: z.string().min(1),
  title: z.string().optional(),
  source: z.enum(jobSources).default("Manual"),
  status: z.enum(jobStatuses).default("New"),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
  location: z.string().optional(),
  jobUrl: optionalUrl,
  salaryRange: z.string().optional(),
  deadline: optionalDeadline,
  description: z.string().optional(),
});

export const jobUpdateSchema = jobCreateSchema.partial();
