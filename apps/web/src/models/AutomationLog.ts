import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAutomationLog extends Document {
  moduleId:   string;
  moduleName: string;
  status:     "success" | "failure" | "skipped";
  message:    string;
  duration:   number;
  metadata?:  Record<string, unknown>;
  createdAt:  Date;
}

const AutomationLogSchema = new Schema<IAutomationLog>(
  {
    moduleId:   { type: String, required: true },
    moduleName: { type: String, required: true },
    status:     { type: String, enum: ["success", "failure", "skipped"], required: true },
    message:    { type: String, required: true },
    duration:   { type: Number, default: 0 },
    metadata:   { type: Schema.Types.Mixed },
  },
  { timestamps: true, capped: { size: 10_000_000, max: 5000 } }
);

AutomationLogSchema.index({ moduleId: 1, createdAt: -1 });
AutomationLogSchema.index({ status: 1 });

const AutomationLogModel: Model<IAutomationLog> =
  mongoose.models.AutomationLog ??
  mongoose.model<IAutomationLog>("AutomationLog", AutomationLogSchema);

export default AutomationLogModel;
