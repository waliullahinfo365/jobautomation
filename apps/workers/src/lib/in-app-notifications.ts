import { NotificationModel } from "@jobflow/database/models";

export type InAppNotificationType = "success" | "warning" | "failed" | "info";

/** Persists an in-app notification (topbar bell) from workers. */
export async function createInAppNotification(input: {
  tenantId: string;
  userId?: string;
  title: string;
  message: string;
  type: InAppNotificationType;
  module?: string;
  relatedRecordType?: string;
  relatedRecordId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
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
    tenantId: input.tenantId,
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
