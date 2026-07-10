import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { assertTenantId } from "../services/baseTenant.service";
import {
  getVapidPublicKey,
  removePushSubscription,
  savePushSubscription,
} from "../services/push-notification.service";

/** GET /notifications/push/vapid-public-key */
export const getVapidPublicKeyHandler = asyncHandler(async (_req: Request, res: Response) => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    throw new ApiError("Web push is not configured on this server", 503, "PUSH_NOT_CONFIGURED");
  }
  return successResponse(res, { publicKey }, "VAPID public key");
});

/** POST /notifications/push/subscribe */
export const subscribePushHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id;
  if (!userId) throw new ApiError("Unauthorized", 401, "UNAUTHORIZED");

  const { subscription } = req.body as {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  };
  const endpoint = subscription?.endpoint?.trim();
  const p256dh = subscription?.keys?.p256dh?.trim();
  const auth = subscription?.keys?.auth?.trim();
  if (!endpoint || !p256dh || !auth) {
    throw new ApiError("Invalid push subscription payload", 422, "VALIDATION_ERROR");
  }

  await savePushSubscription({
    tenantId,
    userId,
    endpoint,
    keys: { p256dh, auth },
    userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined,
  });

  return successResponse(res, { subscribed: true }, "Push subscription saved");
});

/** POST /notifications/push/unsubscribe */
export const unsubscribePushHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id;
  if (!userId) throw new ApiError("Unauthorized", 401, "UNAUTHORIZED");

  const endpoint = String((req.body as { endpoint?: string }).endpoint ?? "").trim();
  if (!endpoint) throw new ApiError("endpoint is required", 422, "VALIDATION_ERROR");

  await removePushSubscription({ tenantId, userId, endpoint });
  return successResponse(res, { unsubscribed: true }, "Push subscription removed");
});
