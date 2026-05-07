import { Router } from "express";
import {
  getUnreadNotificationsCount,
  listNotifications,
  postMarkAllNotificationsRead,
  postMarkNotificationRead,
} from "../controllers/notification.controller";

export const notificationRoutes = Router();

notificationRoutes.get("/", listNotifications);
notificationRoutes.get("/unread-count", getUnreadNotificationsCount);
notificationRoutes.post("/mark-all-read", postMarkAllNotificationsRead);
notificationRoutes.post("/:id/read", postMarkNotificationRead);
