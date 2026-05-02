import { model, models, Schema } from "mongoose";
import { applyBaseIndexes, withBaseFields } from "../schemas/base.schema";
const JobSchema = new Schema(withBaseFields({
    company: { type: String, required: true },
    position: { type: String, required: true },
    source: String,
    status: { type: String, enum: ["New", "Research", "Drafting", "Ready to Apply", "Applied", "Interview", "Offer", "Rejected", "Archived"], required: true },
    priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
    location: String,
    jobUrl: String,
    salaryRange: String,
    deadline: Date,
    dateFound: Date,
    dateApplied: Date,
    applicationId: String,
    lastStatusChangedAt: Date,
    contactEmail: String,
    description: String,
    aiSummary: String,
    duplicateStatus: { type: String, enum: ["Unique", "Duplicate", "Possible Duplicate", "Skipped"], default: "Unique" },
    duplicateOfJobId: String,
    duplicateScore: Number,
    fingerprintHash: { type: String, index: true },
    intakeSource: String,
    providerMessageId: String,
    providerThreadId: String,
    extractedFromEmail: { type: Boolean, default: false },
    extractionConfidence: Number,
    aiProcessingStatus: {
        type: String,
        enum: ["Not Started", "Queued", "Processing", "Completed", "Failed"],
        default: "Not Started",
    },
    aiProcessingStartedAt: Date,
    aiProcessingCompletedAt: Date,
    aiProcessingError: String,
    researchGenerated: { type: Boolean, default: false },
    draftGenerated: { type: Boolean, default: false },
    lastAiRunAt: Date,
    folderCreated: { type: Boolean, default: false },
    driveFolderId: String,
    driveFolderUrl: String,
    folderProvisionStatus: {
        type: String,
        enum: ["Not Started", "Queued", "Completed", "Failed"],
        default: "Not Started",
    },
    folderProvisionedAt: Date,
    folderProvisionError: String,
    tags: { type: [String], default: [] },
    notes: String,
    rawSourceData: { type: Schema.Types.Mixed, default: {} },
}), { timestamps: true });
applyBaseIndexes(JobSchema, true);
JobSchema.index({ tenantId: 1, status: 1 });
JobSchema.index({ tenantId: 1, company: 1, position: 1 });
JobSchema.index({ tenantId: 1, jobUrl: 1 });
JobSchema.index({ tenantId: 1, fingerprintHash: 1 }, { unique: true, sparse: true });
JobSchema.index({ deadline: 1 });
export const JobModel = models.Job || model("Job", JobSchema);
