import { model, models, Schema } from "mongoose";
import { applyBaseIndexes, withBaseFields } from "../schemas/base.schema";

const AiUsageLogSchema = new Schema(
  withBaseFields({
    userId: String,
    provider: { type: String, required: true },
    model: { type: String, required: true },
    runType: { type: String, required: true },
    operationId: String,
    relatedRecordType: String,
    relatedRecordId: String,
    estimatedInputTokens: { type: Number, default: 0 },
    estimatedOutputTokens: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    usedStub: { type: Boolean, default: true },
  }),
  { timestamps: { createdAt: true, updatedAt: false } }
);

applyBaseIndexes(AiUsageLogSchema, false);
AiUsageLogSchema.index({ tenantId: 1, createdAt: -1 });
AiUsageLogSchema.index({ tenantId: 1, provider: 1 });
AiUsageLogSchema.index({ tenantId: 1, runType: 1 });

export const AiUsageLogModel = models.AiUsageLog || model("AiUsageLog", AiUsageLogSchema);
