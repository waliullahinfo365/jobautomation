import mongoose, { Schema, Document as MongoDocument, Model } from "mongoose";
import { DOCUMENT_STATUSES, DOCUMENT_TYPES } from "@/config/statuses";

export interface IDocument extends MongoDocument {
  name:           string;
  type:           string;
  status:         string;
  jobId?:         mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  driveFileId?:   string;
  driveUrl?:      string;
  content?:       string;
  version:        number;
  generatedByAI:  boolean;
  createdAt:      Date;
  updatedAt:      Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    name:   { type: String, required: true },
    type:   { type: String, enum: DOCUMENT_TYPES, required: true },
    status: { type: String, enum: DOCUMENT_STATUSES, default: "Draft" },
    jobId:         { type: Schema.Types.ObjectId, ref: "Job" },
    applicationId: { type: Schema.Types.ObjectId, ref: "Application" },
    driveFileId:   String,
    driveUrl:      String,
    content:       String,
    version:       { type: Number, default: 1 },
    generatedByAI: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const DocumentModel: Model<IDocument> =
  mongoose.models.JobDocument ??
  mongoose.model<IDocument>("JobDocument", DocumentSchema);

export default DocumentModel;
