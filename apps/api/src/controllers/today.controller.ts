import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { assertTenantId } from "../services/baseTenant.service";
import { getTodaySummary } from "../services/today-summary.service";
import { UserModel } from "@jobflow/database/models";

export const getTodaySummaryHandler = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  let timezone: string | undefined;
  if (userId) {
    const user = await UserModel.findOne({ _id: userId, tenantId }).select("timezone preferences").lean();
    const u = user as Record<string, unknown> | null;
    timezone =
      (typeof u?.timezone === "string" ? u.timezone : undefined) ??
      (typeof (u?.preferences as Record<string, unknown> | undefined)?.timezone === "string"
        ? String((u?.preferences as Record<string, unknown>).timezone)
        : undefined);
  }
  const summary = await getTodaySummary({ tenantId, userId, timezone });
  return successResponse(res, summary);
});
