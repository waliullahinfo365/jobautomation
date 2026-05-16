import { logger } from "../utils/logger";

const REGISTERED_PROCESSORS = [
  "job-intake",
  "duplicate-protection",
  "ai-processing",
  "cover-letter (alias->ai-processing:draft)",
  "research-document",
  "folder-automation",
  "cv-routing",
  "pdf-export",
  "interview-scheduling",
  "daily-digest",
  "weekly-report",
  "follow-up-reminder",
  "email-reply-detection",
  "applied-status",
  "deadline-alert",
  "lifecycle-monitoring",
  "offer-tracking",
  "network-follow-up",
  "job-apply",
] as const;

export function registerProcessors() {
  logger.info({ processors: REGISTERED_PROCESSORS }, "automation processors registered");
  return REGISTERED_PROCESSORS;
}
