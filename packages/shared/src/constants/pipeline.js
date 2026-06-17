"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobPipelineStages = void 0;
exports.legacyJobStatusToPipelineStage = legacyJobStatusToPipelineStage;
exports.applicationStatusToPipelineStage = applicationStatusToPipelineStage;
exports.pipelineStageToJobStatusFilter = pipelineStageToJobStatusFilter;
/** Canonical 8-stage pipeline for Today, Jobs, and Insights. */
exports.jobPipelineStages = [
    "New",
    "Saved",
    "Drafting",
    "Ready",
    "Applied",
    "Interview",
    "Offer",
    "Closed",
];
/** Legacy Job.status → pipeline stage (for reads / migration). */
function legacyJobStatusToPipelineStage(status) {
    switch (status) {
        case "New":
            return "New";
        case "Saved":
            return "Saved";
        case "Research":
        case "Drafting":
            return "Drafting";
        case "Ready to Apply":
        case "Applying":
        case "External Apply Required":
            return "Ready";
        case "Applied":
            return "Applied";
        case "Interview":
            return "Interview";
        case "Offer":
            return "Offer";
        case "Rejected":
        case "Archived":
            return "Closed";
        default:
            return "New";
    }
}
/** Application.applicationStatus → Job.pipelineStage (write-through after Application exists). */
function applicationStatusToPipelineStage(applicationStatus) {
    switch (applicationStatus) {
        case "Drafted":
        case "Ready":
            return "Ready";
        case "In Progress":
            return "Ready";
        case "Applied":
        case "Follow-Up Due":
        case "Replied":
            return "Applied";
        case "Interview":
            return "Interview";
        case "Offer":
            return "Offer";
        case "Rejected":
        case "Archived":
            return "Closed";
        default:
            return "Applied";
    }
}
/** Map pipeline stage filter (URL) to Job.status query values. */
function pipelineStageToJobStatusFilter(stage) {
    switch (stage) {
        case "New":
            return ["New"];
        case "Saved":
            return ["Saved"];
        case "Drafting":
            return ["Research", "Drafting"];
        case "Ready":
            return ["Ready to Apply", "Applying", "External Apply Required"];
        case "Applied":
            return ["Applied"];
        case "Interview":
            return ["Interview"];
        case "Offer":
            return ["Offer"];
        case "Closed":
            return ["Rejected", "Archived"];
        default:
            return null;
    }
}
