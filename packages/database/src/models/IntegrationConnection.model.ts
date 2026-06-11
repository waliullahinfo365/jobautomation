import { model, models, Schema } from "mongoose";
import { applyBaseIndexes, withBaseFields } from "../schemas/base.schema";
/** Provider is intentionally unenumerated: catalog providers, AI keys, and Playwright session rows (e.g. playwright-session-linkedin) share this collection. */
const IntegrationConnectionSchema = new Schema(withBaseFields({ provider: { type: String, required: true }, status: { type: String, enum: ["Connected", "Not Connected", "Needs Attention", "Expired", "Disabled"], required: true }, connectedEmail: String, accountName: String, scopes: { type: [String], default: [] }, accessTokenEncrypted: String, refreshTokenEncrypted: String, expiresAt: Date, lastSyncAt: Date, syncStatus: String, errorMessage: String, metadata: { type: Schema.Types.Mixed, default: {} } }), { timestamps: true });
applyBaseIndexes(IntegrationConnectionSchema, true); IntegrationConnectionSchema.index({ tenantId: 1, provider: 1 }, { unique: true });
export const IntegrationConnectionModel = models.IntegrationConnection || model("IntegrationConnection", IntegrationConnectionSchema);
