import { TenantModel } from "@jobflow/database/models";
import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/errors";
import { getCurrentPlan, usagePercentages } from "../services/billing.service";
import { assertTenantId } from "../services/baseTenant.service";
import { recalculateTenantUsage } from "../services/usage.service";

export const getCurrentTenant = asyncHandler(async (req: Request, res) => {
  const tenant = await TenantModel.findById(req.tenantId);
  if (!tenant) throw new ApiError("Tenant not found", 404, "TENANT_NOT_FOUND");
  return successResponse(res, tenant);
});

export const updateCurrentTenant = asyncHandler(async (req: Request, res) => {
  const tenant = await TenantModel.findByIdAndUpdate(req.tenantId, req.body, { new: true });
  if (!tenant) throw new ApiError("Tenant not found", 404, "TENANT_NOT_FOUND");
  return successResponse(res, tenant, "Tenant updated");
});

export const getTenantUsage = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const recalc = req.query.recalculate === "true";
  if (recalc) await recalculateTenantUsage({ tenantId });
  const snapshot = await getCurrentPlan({ tenantId });
  const percentages = usagePercentages(snapshot);
  return successResponse(res, {
    tenantId,
    planKey: snapshot.planKey,
    billingStatus: snapshot.billingStatus,
    usage: snapshot.usage,
    limits: snapshot.limits,
    usagePercentages: percentages,
  });
});
