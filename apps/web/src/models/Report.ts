import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReport extends Document {
  type:      "daily" | "weekly";
  date:      Date;
  payload:   Record<string, unknown>;
  sentAt?:   Date;
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    type:    { type: String, enum: ["daily", "weekly"], required: true },
    date:    { type: Date, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    sentAt:  Date,
  },
  { timestamps: true }
);

ReportSchema.index({ type: 1, date: -1 });

const ReportModel: Model<IReport> =
  mongoose.models.Report ?? mongoose.model<IReport>("Report", ReportSchema);

export default ReportModel;
