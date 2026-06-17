/** How the application record was created or last documented. */
export const applyMethods = ["manual", "linkedin_auto", "manual_log", "manual_assistant"] as const;
export type ApplyMethod = (typeof applyMethods)[number];

export const FOLLOW_UP_DEFAULT_DAYS = 7;

export type FollowUpPolicy =
  | { kind: "none" }
  | { kind: "schedule"; days: number }
  | { kind: "suppress"; days: number };

/** Whether Application.applicationStatus should write through to Job.pipelineStage. */
export function shouldSyncJobPipelineFromApplicationStatus(applicationStatus: string): boolean {
  return applicationStatus !== "In Progress";
}

export function followUpPolicyForApplicationStatus(applicationStatus: string): FollowUpPolicy {
  switch (applicationStatus) {
    case "Applied":
    case "Interview":
      return { kind: "schedule", days: FOLLOW_UP_DEFAULT_DAYS };
    case "Rejected":
      return { kind: "suppress", days: FOLLOW_UP_DEFAULT_DAYS };
    case "In Progress":
      return { kind: "none" };
    default:
      return { kind: "none" };
  }
}

export function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}
