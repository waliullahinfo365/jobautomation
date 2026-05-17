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

/** GET /integrations/linkedin/session — check session status + latest login attempt result */
export const getLinkedInSessionStatus = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);

  const [sessionRow, attemptRow] = await Promise.all([
    IntegrationConnectionModel.findOne({
      tenantId,
      provider: "playwright-session-linkedin",
      status: "Connected",
    }).lean() as Promise<Record<string, unknown> | null>,
    IntegrationConnectionModel.findOne({
      tenantId,
      provider: "playwright-session-linkedin-attempt",
    }).lean() as Promise<Record<string, unknown> | null>,
  ]);

  const attemptMeta = (attemptRow?.metadata as Record<string, unknown>) ?? {};
  const attemptStatus = attemptRow?.syncStatus as string | undefined;
  const attemptMessage = (attemptMeta.message as string | undefined) ?? undefined;

  if (sessionRow) {
    const meta = (sessionRow.metadata as Record<string, unknown>) ?? {};
    return successResponse(res, {
      connected: true,
      savedAt: meta.savedAt ?? sessionRow.lastSyncAt ?? null,
      loginError: null,
    }, "LinkedIn session status");
  }

  // No active session — return attempt state so UI can show error immediately
  return successResponse(res, {
    connected: false,
    savedAt: null,
    loginAttemptStatus: attemptStatus ?? null,  // "pending" | "connected" | "failed" | null
    loginError: attemptStatus === "failed" ? (attemptMessage ?? null) : null,
  }, "LinkedIn session status");
});

/** DELETE /integrations/linkedin/session — remove saved session */
export const deleteLinkedInSession = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);

  await Promise.all([
    IntegrationConnectionModel.deleteOne({ tenantId, provider: "playwright-session-linkedin" }),
    IntegrationConnectionModel.deleteOne({ tenantId, provider: "playwright-session-linkedin-attempt" }),
  ]);

  return successResponse(res, { disconnected: true }, "LinkedIn session removed");
});
