import { Router } from "express";
import {
  getUnreadNotificationsCount,
  listNotifications,
  postMarkAllNotificationsRead,
  postMarkNotificationRead,
} from "../controllers/notification.controller";
import {
  getVapidPublicKeyHandler,
  subscribePushHandler,
  unsubscribePushHandler,
} from "../controllers/push-notification.controller";

export const notificationRoutes = Router();

notificationRoutes.get("/push/vapid-public-key", getVapidPublicKeyHandler);
notificationRoutes.post("/push/subscribe", subscribePushHandler);
notificationRoutes.post("/push/unsubscribe", unsubscribePushHandler);

notificationRoutes.get("/", listNotifications);
notificationRoutes.get("/unread-count", getUnreadNotificationsCount);
notificationRoutes.post("/mark-all-read", postMarkAllNotificationsRead);
notificationRoutes.post("/:id/read", postMarkNotificationRead);
