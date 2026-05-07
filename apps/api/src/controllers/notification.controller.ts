import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { assertTenantId } from "../services/baseTenant.service";
import {
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
} from "../services/in-app-notification.service";

function viewerUserId(req: Request): string {
  return req.user?.id ?? "system";
}

export const listNotifications = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = viewerUserId(req);
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
  const rows = await listNotificationsForUser({ tenantId, userId, limit });
  return successResponse(res, rows);
});

export const getUnreadNotificationsCount = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = viewerUserId(req);
  const count = await unreadNotificationCount({ tenantId, userId });
  return successResponse(res, { count });
});

export const postMarkNotificationRead = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = viewerUserId(req);
  const result = await markNotificationRead({ tenantId, userId, notificationId: req.params.id });
  return successResponse(res, result);
});

export const postMarkAllNotificationsRead = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = viewerUserId(req);
  const result = await markAllNotificationsRead({ tenantId, userId });
  return successResponse(res, result);
});
