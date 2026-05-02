import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIntegration extends Document {
  userId:       mongoose.Types.ObjectId;
  provider:     string;
  status:       "connected" | "disconnected" | "error" | "pending";
  config:       Record<string, unknown>;
  lastSyncAt?:  Date;
  errorMessage?: string;
  createdAt:    Date;
  updatedAt:    Date;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, required: true },
    status: {
      type:    String,
      enum:    ["connected", "disconnected", "error", "pending"],
      default: "disconnected",
    },
    config:       { type: Schema.Types.Mixed, default: {} },
    lastSyncAt:   Date,
    errorMessage: String,
  },
  { timestamps: true }
);

IntegrationSchema.index({ userId: 1, provider: 1 }, { unique: true });

const IntegrationModel: Model<IIntegration> =
  mongoose.models.Integration ??
  mongoose.model<IIntegration>("Integration", IntegrationSchema);

export default IntegrationModel;
