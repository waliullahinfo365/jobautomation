import { model, models, Schema } from "mongoose";
import { applyBaseIndexes, withBaseFields } from "../schemas/base.schema";
const AutomationLogSchema = new Schema(withBaseFields({
    moduleKey: { type: String, required: true },
    moduleName: { type: String, required: true },
    status: { type: String, enum: ["Success", "Warning", "Failed", "Running"], required: true },
    message: { type: String, required: true },
    relatedRecordType: String,
    relatedRecordId: String,
    durationMs: Number,
    metadata: { type: Schema.Types.Mixed, default: {} },
    error: String,
    idempotencyKey: String,
    operationId: String,
    correlationId: String,
}), { timestamps: true });
applyBaseIndexes(AutomationLogSchema, true);
AutomationLogSchema.index({ tenantId: 1, moduleKey: 1 });
AutomationLogSchema.index({ tenantId: 1, status: 1 });
AutomationLogSchema.index({ tenantId: 1, idempotencyKey: 1 });
AutomationLogSchema.index({ createdAt: -1 });
export const AutomationLogModel = models.AutomationLog || model("AutomationLog", AutomationLogSchema);
