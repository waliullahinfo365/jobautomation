import mongoose, { Schema, Document, Model } from "mongoose";
import { JOB_STATUSES } from "@/config/statuses";

export interface IJob extends Document {
  title:         string;
  company:       string;
  location:      string;
  remote:        boolean;
  url:           string;
  description?:  string;
  salary?: {
    min?:      number;
    max?:      number;
    currency:  string;
  };
  status:         string;
  source:         string;
  tags:           string[];
  deadline?:      Date;
  notes?:         string;
  driveFolderId?: string;
  applicationId?: mongoose.Types.ObjectId;
  contactIds:     mongoose.Types.ObjectId[];
  createdAt:      Date;
  updatedAt:      Date;
}

const JobSchema = new Schema<IJob>(
  {
    title:       { type: String, required: true, trim: true },
    company:     { type: String, required: true, trim: true },
    location:    { type: String, default: "" },
    remote:      { type: Boolean, default: false },
    url:         { type: String, default: "" },
    description: { type: String },
    salary: {
      min:      Number,
      max:      Number,
      currency: { type: String, default: "USD" },
    },
    status: {
      type:    String,
      enum:    JOB_STATUSES,
      default: "New",
    },
    source:         { type: String, default: "Manual" },
    tags:           [{ type: String }],
    deadline:       { type: Date },
    notes:          { type: String },
    driveFolderId:  { type: String },
    applicationId:  { type: Schema.Types.ObjectId, ref: "Application" },
    contactIds:     [{ type: Schema.Types.ObjectId, ref: "Contact" }],
  },
  { timestamps: true }
);

JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ company: 1 });
JobSchema.index({ title: "text", company: "text", description: "text" });

const JobModel: Model<IJob> =
  mongoose.models.Job ?? mongoose.model<IJob>("Job", JobSchema);

export default JobModel;
