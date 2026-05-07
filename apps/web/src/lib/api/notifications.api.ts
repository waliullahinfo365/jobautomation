import { apiFetch, withQuery } from "./client";

export type InAppNotificationDto = {
  id: string;
  title: string;
  message: string;
  severity: "info" | "success" | "warning" | "failed";
  moduleKey?: string;
  relatedRecordType?: string;
  relatedRecordId?: string;
  actionUrl?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  read: boolean;
};

export function listNotifications(params?: { limit?: number }) {
  return apiFetch<InAppNotificationDto[]>(withQuery("/notifications", params as never));
}

export function getUnreadNotificationCount() {
  return apiFetch<{ count: number }>("/notifications/unread-count");
}

export function markNotificationRead(id: string) {
  return apiFetch(`/notifications/${id}/read`, { method: "POST", body: {} });
}

export function markAllNotificationsRead() {
  return apiFetch("/notifications/mark-all-read", { method: "POST", body: {} });
}
