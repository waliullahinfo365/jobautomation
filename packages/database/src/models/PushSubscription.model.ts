import { model, models, Schema } from "mongoose";
import { applyBaseIndexes, withBaseFields } from "../schemas/base.schema";

const PushSubscriptionSchema = new Schema(
  withBaseFields({
    userId: { type: String, required: true },
    endpoint: { type: String, required: true },
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
    userAgent: String,
    expiresAt: Date,
  }),
  { timestamps: true }
);

applyBaseIndexes(PushSubscriptionSchema, false);
PushSubscriptionSchema.index({ tenantId: 1, userId: 1 });
PushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

export const PushSubscriptionModel =
  models.PushSubscription || model("PushSubscription", PushSubscriptionSchema);
