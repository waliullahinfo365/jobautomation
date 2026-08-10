import { model, models, Schema } from "mongoose";
import { applyBaseIndexes, withBaseFields } from "../schemas/base.schema";
const UserSchema = new Schema(
  withBaseFields({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    avatarUrl: String,
    role: { type: String, enum: ["Owner", "Admin", "Member", "Viewer"], required: true },
    status: { type: String, enum: ["Active", "Invited", "Suspended", "Removed"], default: "Invited" },
    timezone: String,
    lastLoginAt: Date,
    emailVerifiedAt: Date,
    preferences: { type: Schema.Types.Mixed, default: {} },
    passwordResetTokenHash: { type: String, index: true },
    passwordResetExpiresAt: Date,
  }),
  { timestamps: true }
);
applyBaseIndexes(UserSchema, true);
UserSchema.index({ tenantId: 1, role: 1 }); // email unique index is created by `unique: true` on the field definition
export const UserModel = models.User || model("User", UserSchema);
