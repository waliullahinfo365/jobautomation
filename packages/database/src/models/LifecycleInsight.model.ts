import { model, models, Schema } from "mongoose";
import { applyBaseIndexes, withBaseFields } from "../schemas/base.schema";

/**
 * Persisted pipeline health insight raised by the lifecycle-monitoring processor.
 * One open insight per (tenantId, deduplicationKey) — resolved automatically when
 * the underlying condition clears.
 */
const LifecycleInsightSchema = new Schema(
  withBaseFields({
    recordType: {
      type: String,
      enum: ["Job", "Application", "Interview", "System"],
      required: true,
    },
    recordId: { type: String, required: true },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      required: true,
    },
    issueType: { type: String, required: true },
    message: { type: String, required: true },
    recommendedAction: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },
    resolvedAt: Date,
    resolvedReason: String,
    /** `${recordType}:${recordId}:${issueType}` — uniqueness scope within tenant */
    deduplicationKey: { type: String, required: true },
    /** operationId of the sweep that last updated this insight */
    lastSeenOperationId: String,
  }),
  { timestamps: true }
);

applyBaseIndexes(LifecycleInsightSchema, false);

// Fast dedup lookup: one open insight per (tenant, dedup key)
LifecycleInsightSchema.index(
  { tenantId: 1, deduplicationKey: 1, status: 1 },
  { name: "insight_dedup" }
);
// Dashboard queries: open issues by severity
LifecycleInsightSchema.index({ tenantId: 1, status: 1, severity: 1, createdAt: -1 });
// Resolution sweep: find open insights for a record
LifecycleInsightSchema.index({ tenantId: 1, recordId: 1, issueType: 1, status: 1 });

export const LifecycleInsightModel =
  models.LifecycleInsight || model("LifecycleInsight", LifecycleInsightSchema);
