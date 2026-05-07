import { NotificationModel } from "@jobflow/database/models";
import mongoose from "mongoose";
import { assertTenantId } from "./baseTenant.service";
import { ApiError } from "../utils/errors";

export type UserNotificationType = "success" | "warning" | "failed" | "info";

/** Persists an in-app notification (topbar bell). Separate from Telegram/Slack external sends. */
export async function createUserNotification(input: {
  tenantId: string;
  userId?: string;
  title: string;
  message: string;
  type: UserNotificationType;
  module?: string;
  relatedRecordType?: string;
  relatedRecordId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  const tenantId = assertTenantId(input.tenantId);
  const actor = input.userId ?? "system";
  const severity: "info" | "success" | "warning" | "failed" =
    input.type === "failed"
      ? "failed"
      : input.type === "warning"
        ? "warning"
        : input.type === "success"
          ? "success"
          : "info";
  await NotificationModel.create({
    tenantId,
    createdBy: actor,
    updatedBy: actor,
    title: input.title,
    body: input.message,
    severity,
    moduleKey: input.module,
    relatedRecordType: input.relatedRecordType,
    relatedRecordId: input.relatedRecordId,
    actionUrl: input.actionUrl,
    metadata: input.metadata ?? {},
    readUserIds: [],
  });
}

export async function listNotificationsForUser(input: { tenantId: string; userId: string; limit?: number }) {
  const tenantId = assertTenantId(input.tenantId);
  const uid = input.userId;
  const rows = await NotificationModel.find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(input.limit ?? 50, 1), 100))
    .lean()
    .exec();

  return rows.map((n) => ({
    id: String(n._id),
    title: n.title,
    message: n.body,
    severity: n.severity as UserNotificationType,
    moduleKey: n.moduleKey,
    relatedRecordType: n.relatedRecordType,
    relatedRecordId: n.relatedRecordId,
    actionUrl: n.actionUrl,
    metadata: (n.metadata as Record<string, unknown>) ?? {},
    createdAt:
      n.createdAt instanceof Date ? n.createdAt.toISOString() : typeof n.createdAt === "string" ? n.createdAt : "",
    read: Array.isArray(n.readUserIds) && n.readUserIds.includes(uid),
  }));
}

export async function unreadNotificationCount(input: { tenantId: string; userId: string }) {
  const tenantId = assertTenantId(input.tenantId);
  const uid = input.userId;
  return NotificationModel.countDocuments({
    tenantId,
    readUserIds: { $nin: [uid] },
  });
}

export async function markNotificationRead(input: { tenantId: string; userId: string; notificationId: string }) {
  const tenantId = assertTenantId(input.tenantId);
  if (!mongoose.Types.ObjectId.isValid(input.notificationId)) {
    throw new ApiError("Invalid notification id", 400, "INVALID_ID");
  }
  const row = await NotificationModel.findOneAndUpdate(
    { _id: input.notificationId, tenantId },
    { $addToSet: { readUserIds: input.userId }, updatedBy: input.userId },
    { new: true }
  ).lean();
  if (!row) throw new ApiError("Notification not found", 404, "NOT_FOUND");
  return { ok: true };
}

export async function markAllNotificationsRead(input: { tenantId: string; userId: string }) {
  const tenantId = assertTenantId(input.tenantId);
  await NotificationModel.updateMany(
    { tenantId, readUserIds: { $nin: [input.userId] } },
    { $addToSet: { readUserIds: input.userId }, $set: { updatedBy: input.userId } }
  );
  return { ok: true };
}
