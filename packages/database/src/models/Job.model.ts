import { model, models, Schema } from "mongoose";
import { applyBaseIndexes, withBaseFields } from "../schemas/base.schema";
const JobSchema = new Schema(
  withBaseFields({
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
    fingerprintHash: { type: String },
    intakeSource: String,
    providerMessageId: String,
    providerThreadId: String,
    extractedFromEmail: { type: Boolean, default: false },
    extractionConfidence: Number,
    jobIntakeClassification: {
      isJobOpportunity: Boolean,
      confidence: Number,
      reason: String,
      emailType: { type: String, enum: ["job_alert", "recruiter_opportunity", "newsletter", "notification", "marketing", "unknown"] },
    },
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
    driveFolderLink: String,
    cvFolderId: String,
    coverLetterFolderId: String,
    researchFolderId: String,
    applicationProofFolderId: String,
    interviewPrepFolderId: String,
    researchFolderLink: String,
    coverLetterFolderLink: String,
    cvFolderLink: String,
    applicationProofFolderLink: String,
    interviewPrepFolderLink: String,
    aiDraftDocId: String,
    aiDraftDocUrl: String,
    sourceCvDocumentId: String,
    sourceCvFileName: String,
    coverLetterTemplateDocumentId: String,
    coverLetterTemplateFileName: String,
    generatedCoverLetterDocumentId: String,
    generatedCoverLetterLink: String,
    researchDocumentId: String,
    researchDocumentLink: String,
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
    deadlineAlertSentAt: Date,
    deadlineAlertKey: String,
    deadlineAlertError: String,
    // Quick Review / swipe fields
    reviewStatus: { type: String, enum: ["new", "rejected", "review_later", "saved", "apply_next"], default: "new" },
    reviewedAt: Date,
    reviewedBy: String,
    reviewAction: String,
    previousReviewStatus: String,
    // AI review analysis cache
    reviewAiScore: Number,
    reviewAiReasons: { type: [String], default: [] },
    reviewAiRedFlags: { type: [String], default: [] },
    reviewAiEffort: { type: String, enum: ["Low", "Medium", "High"] },
    reviewAiRecommendation: String,
    reviewAiGeneratedAt: Date,
  }),
  { timestamps: true }
);

applyBaseIndexes(JobSchema, true);
JobSchema.index({ tenantId: 1, status: 1 });
JobSchema.index({ tenantId: 1, company: 1, position: 1 });
JobSchema.index({ tenantId: 1, jobUrl: 1 });
JobSchema.index({ tenantId: 1, fingerprintHash: 1 }, { unique: true, sparse: true });
JobSchema.index({ deadline: 1 });
JobSchema.index({ tenantId: 1, deadlineAlertKey: 1 }, { sparse: true });
JobSchema.index({ tenantId: 1, reviewStatus: 1 });
export const JobModel = models.Job || model("Job", JobSchema);
