import mongoose, { Schema, Document, Model } from "mongoose";
import { APPLICATION_STATUSES } from "@/config/statuses";

interface IApplicationEvent {
  date:   Date;
  status: string;
  note?:  string;
}

export interface IApplication extends Document {
  jobId:       mongoose.Types.ObjectId;
  userId:      mongoose.Types.ObjectId;
  status:      string;
  appliedAt?:  Date;
  timeline:    IApplicationEvent[];
  cvVersion?:  string;
  coverLetter?: string;
  notes?:      string;
  followUpSentAt?:     Date;
  responseReceivedAt?: Date;
  interviewIds:        mongoose.Types.ObjectId[];
  createdAt:           Date;
  updatedAt:           Date;
}

const ApplicationEventSchema = new Schema<IApplicationEvent>(
  {
    date:   { type: Date, required: true },
    status: { type: String, required: true },
    note:   { type: String },
  },
  { _id: false }
);

const ApplicationSchema = new Schema<IApplication>(
  {
    jobId:       { type: Schema.Types.ObjectId, ref: "Job",  required: true },
    userId:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type:    String,
      enum:    APPLICATION_STATUSES,
      default: "Pending",
    },
    appliedAt:           Date,
    timeline:            [ApplicationEventSchema],
    cvVersion:           String,
    coverLetter:         String,
    notes:               String,
    followUpSentAt:      Date,
    responseReceivedAt:  Date,
    interviewIds:        [{ type: Schema.Types.ObjectId, ref: "Interview" }],
  },
  { timestamps: true }
);

ApplicationSchema.index({ jobId: 1, userId: 1 });
ApplicationSchema.index({ status: 1 });

const ApplicationModel: Model<IApplication> =
  mongoose.models.Application ??
  mongoose.model<IApplication>("Application", ApplicationSchema);

export default ApplicationModel;
