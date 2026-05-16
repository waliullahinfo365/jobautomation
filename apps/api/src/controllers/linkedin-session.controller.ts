import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { assertTenantId } from "../services/baseTenant.service";
import { enqueueAutomationModule } from "../services/automation-queue.service";
import { IntegrationConnectionModel } from "@jobflow/database/models";

/** POST /integrations/linkedin/session — enqueue headless login */
export const startLinkedInLogin = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email?.trim()) throw new ApiError("Email is required", 422, "VALIDATION_ERROR");
  if (!password?.trim()) throw new ApiError("Password is required", 422, "VALIDATION_ERROR");

  const result = await enqueueAutomationModule({
    moduleKey: "linkedin-login",
    tenantId,
    userId,
    payload: { email: email.trim(), password },
    source: "api",
  });

  return successResponse(res, {
    operationId: result.operationId,
    status: result.status,
    message: "Login job queued. Session will be ready in ~15 seconds.",
  }, "LinkedIn login queued");
});

/** GET /integrations/linkedin/session — check session status */
export const getLinkedInSessionStatus = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);

  const row = await IntegrationConnectionModel.findOne({
    tenantId,
    provider: "playwright-session-linkedin",
    status: "Connected",
  }).lean() as Record<string, unknown> | null;

  if (!row) {
    return successResponse(res, { connected: false, savedAt: null }, "LinkedIn session status");
  }

  const meta = (row.metadata as Record<string, unknown>) ?? {};
  return successResponse(res, {
    connected: true,
    savedAt: meta.savedAt ?? row.lastSyncAt ?? null,
  }, "LinkedIn session status");
});

/** DELETE /integrations/linkedin/session — remove saved session */
export const deleteLinkedInSession = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);

  await IntegrationConnectionModel.deleteOne({
    tenantId,
    provider: "playwright-session-linkedin",
  });

  return successResponse(res, { disconnected: true }, "LinkedIn session removed");
});
