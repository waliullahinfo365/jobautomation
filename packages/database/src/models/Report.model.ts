import { model, models, Schema } from "mongoose";
import { applyBaseIndexes, withBaseFields } from "../schemas/base.schema";

const ReportSchema = new Schema(
  withBaseFields({
    type: { type: String, enum: ["Daily Digest", "Weekly Performance", "PDF Export", "Manual Report"], required: true },
    status: { type: String, enum: ["Sent", "Generated", "Failed", "Scheduled"], required: true },
    name: { type: String, required: true },
    generatedAt: Date,
    sentAt: Date,
    sentTo: { type: [String], default: [] },
    deliveryMethod: String,
    pdfUrl: String,
    data: { type: Schema.Types.Mixed, default: {} },
    errorMessage: String,
    periodKey: String,
    periodStart: Date,
    periodEnd: Date,
    deliveryStatus: { type: String, enum: ["Not Sent", "Queued", "Sent", "Failed"], default: "Not Sent" },
    deliveryError: String,
    deliveryId: String,
    summaryText: String,
    metrics: { type: Schema.Types.Mixed, default: {} },
    recommendations: { type: [String], default: [] },
    generatedBy: String,
    idempotencyKey: String,
  }),
  { timestamps: true }
);

applyBaseIndexes(ReportSchema, true);
ReportSchema.index({ tenantId: 1, type: 1 });
ReportSchema.index({ tenantId: 1, status: 1 });
ReportSchema.index({ tenantId: 1, periodKey: 1 });
ReportSchema.index({ tenantId: 1, type: 1, periodKey: 1 }, { unique: true, sparse: true });
ReportSchema.index({ generatedAt: -1 });

export const ReportModel = models.Report || model("Report", ReportSchema);
