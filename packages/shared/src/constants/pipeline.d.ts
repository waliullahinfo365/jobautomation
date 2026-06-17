/** Canonical 8-stage pipeline for Today, Jobs, and Insights. */
export declare const jobPipelineStages: readonly ["New", "Saved", "Drafting", "Ready", "Applied", "Interview", "Offer", "Closed"];
export type JobPipelineStage = (typeof jobPipelineStages)[number];
/** Legacy Job.status → pipeline stage (for reads / migration). */
export declare function legacyJobStatusToPipelineStage(status: string): JobPipelineStage;
/** Application.applicationStatus → Job.pipelineStage (write-through after Application exists). */
export declare function applicationStatusToPipelineStage(applicationStatus: string): JobPipelineStage;
/** Map pipeline stage filter (URL) to Job.status query values. */
export declare function pipelineStageToJobStatusFilter(stage: string): string[] | null;
