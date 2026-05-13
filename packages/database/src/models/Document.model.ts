import { model, models, Schema } from "mongoose";
import { applyBaseIndexes, withBaseFields } from "../schemas/base.schema";

const DocumentSchema = new Schema(
  withBaseFields({
    jobId: String,
    applicationId: String,
    fileName: { type: String, required: true },
    type: { type: String, enum: ["CV", "Cover Letter", "Research", "Portfolio", "Other"], required: true },
    status: { type: String, enum: ["Draft", "Ready", "Sent", "Archived"], required: true },
    documentKind: { type: String, enum: ["Research", "Cover Letter", "CV", "PDF Export", "Other"], default: "Other" },
    contentText: String,
    aiProvider: String,
    aiModel: String,
    promptVersion: String,
    generationStatus: { type: String, enum: ["Pending", "Generated", "Failed", "Needs Review"], default: "Pending" },
    generationMetadata: { type: Schema.Types.Mixed, default: {} },
    checksum: String,
    storageProvider: String,
    storagePath: String,
    storageLocation: String,
    storageUrl: String,
    driveFileId: String,
    driveFileLink: String,
    googleDriveFileId: String,
    googleDriveFolderId: String,
    routedToJobFolder: { type: Boolean, default: false },
    routedAt: Date,
    sourceFileId: String,
    targetFolderId: String,
    targetPath: String,
    routingStatus: {
      type: String,
      enum: ["Not Started", "Queued", "Completed", "Failed"],
      default: "Not Started",
    },
    routingError: String,
    pdfExportStatus: {
      type: String,
      enum: ["Not Started", "Queued", "Exported", "Failed", "Preview Only"],
      default: "Not Started",
    },
    pdfUrl: String,
    pdfExportedAt: Date,
    pdfExportError: String,
    version: { type: Number, default: 1 },
    aiGenerated: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  }),
  { timestamps: true }
);

applyBaseIndexes(DocumentSchema, true); // adds tenantId, createdAt:-1, tenantId+status
DocumentSchema.index({ tenantId: 1, type: 1 });
DocumentSchema.index({ jobId: 1 });
DocumentSchema.index({ applicationId: 1 });
// tenantId+status index is already added by applyBaseIndexes

export const DocumentModel = models.Document || model("Document", DocumentSchema);
