import { model, models, Schema } from "mongoose";
import { applyBaseIndexes, withBaseFields } from "../schemas/base.schema";
const AuditLogSchema = new Schema(withBaseFields({ userId: String, action: { type: String, required: true }, entityType: String, entityId: String, message: String, ipAddress: String, userAgent: String, metadata: { type: Schema.Types.Mixed, default: {} } }), { timestamps: true });
applyBaseIndexes(AuditLogSchema); AuditLogSchema.index({ tenantId: 1, userId: 1 }); AuditLogSchema.index({ tenantId: 1, entityType: 1 }); // createdAt: -1 index is already added by applyBaseIndexes
export const AuditLogModel = models.AuditLog || model("AuditLog", AuditLogSchema);
