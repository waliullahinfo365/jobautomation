import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { assertTenantId } from "../services/baseTenant.service";
import { resetOperationalWorkspaceData } from "../services/admin-reset.service";

export function requireAdminResetToken(req: Request, _res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_RESET_TOKEN?.trim();
  if (!expected) {
    return next(new ApiError("ADMIN_RESET_TOKEN is not configured.", 503, "ADMIN_RESET_DISABLED"));
  }
  const provided =
    req.header("x-admin-reset-token") ||
    (typeof req.body?.adminResetToken === "string" ? req.body.adminResetToken : "") ||
    (typeof req.query.adminResetToken === "string" ? req.query.adminResetToken : "");
  if (provided !== expected) {
    return next(new ApiError("Invalid admin reset token.", 403, "FORBIDDEN"));
  }
  next();
}

export const resetOperationalData = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const dryRun = req.body?.dryRun !== false;
  const result = await resetOperationalWorkspaceData({
    tenantId,
    userId: req.user?.id ?? "system",
    dryRun,
    reason: typeof req.body?.reason === "string" ? req.body.reason : undefined,
  });
  return successResponse(res, result, dryRun ? "Reset dry run complete" : "Operational data reset complete");
});
