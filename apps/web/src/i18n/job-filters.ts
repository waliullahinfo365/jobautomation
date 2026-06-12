import type { JobFilters } from "@/types/job";

const STATUS_TO_KEY: Record<string, string> = {
  New: "jobs.pipeline.new",
  Research: "jobs.pipeline.research",
  Drafting: "jobs.pipeline.drafting",
  "Ready to Apply": "jobs.pipeline.readyToApply",
  Applied: "jobs.pipeline.applied",
  Interview: "jobs.pipeline.interview",
  Offer: "jobs.pipeline.offer",
  Rejected: "jobs.pipeline.rejected",
  Archived: "jobs.pipeline.archived",
};

const PRIORITY_TO_KEY: Record<string, string> = {
  Low: "jobs.priorityLevel.low",
  Medium: "jobs.priorityLevel.medium",
  High: "jobs.priorityLevel.high",
  Urgent: "jobs.priorityLevel.urgent",
};

const SOURCE_TO_KEY: Record<string, string> = {
  Gmail: "jobs.sourceKind.gmail",
  LinkedIn: "jobs.sourceKind.linkedin",
  Indeed: "jobs.sourceKind.indeed",
  Stepstone: "jobs.sourceKind.stepstone",
  Xing: "jobs.sourceKind.xing",
  Glassdoor: "jobs.sourceKind.glassdoor",
  Monster: "jobs.sourceKind.monster",
  "Company Website": "jobs.sourceKind.companyWebsite",
  Referral: "jobs.sourceKind.referral",
  Manual: "jobs.sourceKind.manual",
  Other: "jobs.sourceKind.other",
};

/** Label for an import `source` string (may be a board name not in the job filter enum). */
export function jobSourceDisplayLabel(sourceKey: string, t: (k: string) => string): string {
  const key = SOURCE_TO_KEY[sourceKey];
  return key ? t(key) : sourceKey;
}

export function jobFilterStatusLabel(value: JobFilters["status"], t: (k: string) => string): string {
  if (!value || value === "All") return t("jobs.allStatuses");
  const key = STATUS_TO_KEY[value];
  return key ? t(key) : value;
}

/** Pipeline status label for arbitrary strings (e.g. related job status on contacts). */
export function jobPipelineStatusDisplayLabel(status: string, t: (k: string) => string): string {
  const key = STATUS_TO_KEY[status];
  return key ? t(key) : status;
}

export function jobFilterPriorityLabel(value: JobFilters["priority"], t: (k: string) => string): string {
  if (!value || value === "All") return t("jobs.allPriorities");
  const key = PRIORITY_TO_KEY[value];
  return key ? t(key) : value;
}

export function jobFilterSourceLabel(value: JobFilters["source"], t: (k: string) => string): string {
  if (!value || value === "All") return t("jobs.allSources");
  const key = SOURCE_TO_KEY[value];
  return key ? t(key) : value;
}
