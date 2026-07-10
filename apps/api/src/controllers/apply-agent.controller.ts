import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { assertTenantId } from "../services/baseTenant.service";
import {
  createAgentPairingCode,
  exchangeAgentPairingCode,
  getAgentApplyProfile,
  getAgentApplyQueue,
  getAgentStatus,
  recordAgentHeartbeat,
  submitAgentApplyResult,
} from "../services/apply-agent.service";

/** POST /agent/pair — exchange 6-digit code for bearer token (no user JWT). */
export const pairAgentHandler = asyncHandler(async (req: Request, res: Response) => {
  const { code, deviceName, agentVersion } = req.body as {
    code?: string;
    deviceName?: string;
    agentVersion?: string;
  };
  if (!code?.trim()) throw new ApiError("code is required", 422, "VALIDATION_ERROR");

  const result = await exchangeAgentPairingCode({
    code: code.trim(),
    deviceName,
    agentVersion,
  });

  return successResponse(res, result, "Agent paired");
});

/** GET /agent/profile — applicant fields for local Playwright form filling */
export const getAgentProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const profile = await getAgentApplyProfile(tenantId);
  return successResponse(res, profile, "Apply profile");
});

/** GET /agent/apply-queue */
export const getAgentApplyQueueHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const jobs = await getAgentApplyQueue(tenantId);
  return successResponse(res, { jobs }, "Apply queue");
});

/** POST /agent/apply-result */
export const postAgentApplyResultHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const { jobId, success, message, stepsCompleted } = req.body as {
    jobId?: string;
    success?: boolean;
    message?: string;
    stepsCompleted?: number;
  };
  if (!jobId?.trim()) throw new ApiError("jobId is required", 422, "VALIDATION_ERROR");

  const result = await submitAgentApplyResult({
    tenantId,
    jobId: jobId.trim(),
    success: success === true,
    message: String(message ?? ""),
    stepsCompleted: typeof stepsCompleted === "number" ? stepsCompleted : 0,
  });

  return successResponse(res, result, "Apply result recorded");
});

/** POST /agent/heartbeat */
export const postAgentHeartbeatHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const { agentVersion, linkedInConnected } = req.body as {
    agentVersion?: string;
    linkedInConnected?: boolean;
  };

  await recordAgentHeartbeat({ tenantId, agentVersion, linkedInConnected });
  return successResponse(res, { ok: true }, "Heartbeat recorded");
});

/** POST /integrations/apply-agent/pairing-code — user generates code in Settings */
export const createPairingCodeHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id;
  if (!userId) throw new ApiError("Unauthorized", 401, "UNAUTHORIZED");

  const { deviceName } = req.body as { deviceName?: string };
  const result = await createAgentPairingCode({ tenantId, userId, deviceName });
  return successResponse(res, result, "Pairing code created");
});

/** GET /integrations/apply-agent/status */
export const getAgentStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = assertTenantId(req.tenantId);
  const status = await getAgentStatus(tenantId);
  return successResponse(res, status, "Agent status");
});

export async function agentAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Agent bearer token required" });
    return;
  }

  const { resolveAgentTenantFromToken } = await import("../services/apply-agent.service");
  const tenantId = await resolveAgentTenantFromToken(header);
  if (!tenantId) {
    res.status(401).json({ success: false, message: "Invalid agent token" });
    return;
  }

  req.tenantId = tenantId;
  req.user = { id: "apply-agent", role: "Agent" };
  next();
}
