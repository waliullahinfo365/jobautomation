"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FOLLOW_UP_DEFAULT_DAYS = exports.applyMethods = void 0;
exports.shouldSyncJobPipelineFromApplicationStatus = shouldSyncJobPipelineFromApplicationStatus;
exports.followUpPolicyForApplicationStatus = followUpPolicyForApplicationStatus;
exports.addDays = addDays;
/** How the application record was created or last documented. */
exports.applyMethods = ["manual", "linkedin_auto", "manual_log"];
exports.FOLLOW_UP_DEFAULT_DAYS = 7;
/** Whether Application.applicationStatus should write through to Job.pipelineStage. */
function shouldSyncJobPipelineFromApplicationStatus(applicationStatus) {
    return applicationStatus !== "In Progress";
}
function followUpPolicyForApplicationStatus(applicationStatus) {
    switch (applicationStatus) {
        case "Applied":
        case "Interview":
            return { kind: "schedule", days: exports.FOLLOW_UP_DEFAULT_DAYS };
        case "Rejected":
            return { kind: "suppress", days: exports.FOLLOW_UP_DEFAULT_DAYS };
        case "In Progress":
            return { kind: "none" };
        default:
            return { kind: "none" };
    }
}
function addDays(base, days) {
    return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}
