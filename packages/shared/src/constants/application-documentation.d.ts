/** How the application record was created or last documented. */
export declare const applyMethods: readonly ["manual", "linkedin_auto", "manual_log"];
export type ApplyMethod = (typeof applyMethods)[number];
export declare const FOLLOW_UP_DEFAULT_DAYS = 7;
export type FollowUpPolicy = {
    kind: "none";
} | {
    kind: "schedule";
    days: number;
} | {
    kind: "suppress";
    days: number;
};
/** Whether Application.applicationStatus should write through to Job.pipelineStage. */
export declare function shouldSyncJobPipelineFromApplicationStatus(applicationStatus: string): boolean;
export declare function followUpPolicyForApplicationStatus(applicationStatus: string): FollowUpPolicy;
export declare function addDays(base: Date, days: number): Date;
