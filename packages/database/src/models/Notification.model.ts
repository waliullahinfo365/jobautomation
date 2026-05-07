import { model, models, Schema } from "mongoose";
import { applyBaseIndexes, withBaseFields } from "../schemas/base.schema";

/** In-app notifications (topbar bell); distinct from Telegram/Slack external sends. */
const NotificationSchema = new Schema(
  withBaseFields({
    title: { type: String, required: true },
    body: { type: String, required: true },
    severity: {
      type: String,
      enum: ["info", "success", "warning", "failed"],
      default: "info",
    },
    moduleKey: String,
    relatedRecordType: String,
    relatedRecordId: String,
    actionUrl: String,
    metadata: { type: Schema.Types.Mixed, default: {} },
    /** User IDs who dismissed/read this in-app notification */
    readUserIds: { type: [String], default: [] },
  }),
  { timestamps: true }
);

applyBaseIndexes(NotificationSchema, false);
NotificationSchema.index({ tenantId: 1, createdAt: -1 });

export const NotificationModel = models.Notification || model("Notification", NotificationSchema);
