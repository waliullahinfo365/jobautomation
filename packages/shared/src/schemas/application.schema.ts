import { z } from "zod";
import { applicationStatuses, followUpStatuses, responseStatuses } from "../constants/statuses";

const applicationSources = [
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

const optionalJobId = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}, z.string().min(1).optional());

const optionalDateApplied = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T12:00:00.000Z`).toISOString();
  }
  return s;
}, z.string().datetime().optional());

export const applicationCreateSchema = z.object({
  tenantId: z.string().min(1),
  createdBy: z.string().min(1),
  jobId: optionalJobId,
  company: z.string().min(1),
  position: z.string().min(1),
  source: z.enum(applicationSources).optional(),
  applicationStatus: z.enum(applicationStatuses).default("Applied"),
  responseStatus: z.enum(responseStatuses).default("No Response"),
  followUpStatus: z.enum(followUpStatuses).default("Not Needed"),
  jobUrl: optionalUrl,
  contactEmail: z.string().optional(),
  notes: z.string().optional(),
  dateApplied: optionalDateApplied,
});

export const applicationUpdateSchema = applicationCreateSchema.partial();
