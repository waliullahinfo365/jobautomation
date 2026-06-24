import { model, models, Schema } from "mongoose";

const StripeEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const StripeEventModel = models.StripeEvent || model("StripeEvent", StripeEventSchema);
