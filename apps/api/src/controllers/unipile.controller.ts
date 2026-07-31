import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { assertTenantId } from "../services/baseTenant.service";
import {
  createUnipileEmailConnectLink,
  decodeUnipileConnectName,
  disconnectUnipileEmail,
  getUnipileEmailStatus,
  processUnipileMailWebhook,
  scanUnipileEmailsForTenant,
  upsertUnipileEmailConnection,
} from "../services/unipile-email.service";

/** POST /integrations/unipile/connect — returns hosted auth URL */
export const createUnipileConnectHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id;
  if (!userId) throw new ApiError("Unauthorized", 401, "UNAUTHORIZED");

  const result = await createUnipileEmailConnectLink({ tenantId, userId });
  return successResponse(res, result, "Unipile connect link created");
});

/** GET /integrations/unipile/status */
export const getUnipileStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const status = await getUnipileEmailStatus(tenantId);
  return successResponse(res, status, "Unipile status");
});

/** DELETE /integrations/unipile/disconnect */
export const disconnectUnipileHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  await disconnectUnipileEmail({ tenantId, userId });
  return successResponse(res, { disconnected: true }, "Unipile email disconnected");
});

/** POST /integrations/unipile/scan — pull recent emails and run intake */
export const scanUnipileHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const limit = typeof req.body?.limit === "number" ? req.body.limit : undefined;
  const forceAll = req.body?.forceAll === true;
  const result = await scanUnipileEmailsForTenant({ tenantId, userId, limit, forceAll });
  return successResponse(res, result, "Unipile scan completed");
});

/**
 * POST /integrations/unipile/notify — hosted auth callback (public).
 * Payload: { status, account_id, name }
 */
export const unipileNotifyHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { status?: string; account_id?: string; name?: string };
  const status = String(body.status ?? "");
  const accountId = String(body.account_id ?? "").trim();
  const name = String(body.name ?? "").trim();

  if (!accountId || !name) {
    throw new ApiError("Invalid Unipile notify payload", 422, "VALIDATION_ERROR");
  }
  if (status && !["CREATION_SUCCESS", "RECONNECTED"].includes(status)) {
    return successResponse(res, { ignored: true, status }, "Ignored notify status");
  }

  const decoded = decodeUnipileConnectName(name);
  if (!decoded) throw new ApiError("Invalid Unipile connect name", 422, "VALIDATION_ERROR");

  await upsertUnipileEmailConnection({
    tenantId: decoded.tenantId,
    userId: decoded.userId,
    accountId,
  });

  console.info("[unipile] account linked", {
    tenantId: decoded.tenantId,
    accountId,
    status: status || "CREATION_SUCCESS",
  });

  return successResponse(res, { linked: true, accountId }, "Unipile account linked");
});

/** POST /integrations/unipile/webhook — email events (public) */
export const unipileWebhookHandler = asyncHandler(async (req: Request, res: Response) => {
  const secret = process.env.UNIPILE_WEBHOOK_SECRET?.trim();
  if (secret) {
    const header =
      req.header("x-unipile-webhook-secret") ||
      req.header("x-webhook-secret") ||
      req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (header !== secret) {
      throw new ApiError("Invalid webhook secret", 401, "UNAUTHORIZED");
    }
  }

  const result = await processUnipileMailWebhook((req.body ?? {}) as Record<string, unknown>);
  console.info("[unipile] webhook processed", result);
  return successResponse(res, result, "Webhook processed");
});
