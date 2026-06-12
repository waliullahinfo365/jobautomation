import type { Job } from "@/types/job";

/** Public URL for the original job posting, or null if missing. */
export function resolveExternalJobPostingUrl(job: Pick<Job, "jobUrl" | "url">): string | null {
  const raw = (job.jobUrl || job.url || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}
