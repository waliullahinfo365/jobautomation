import { PLAN_DEFINITIONS } from "@shared/constants/plans";
import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { assertTenantId } from "../services/baseTenant.service";
import {
  cancelSubscriptionStub,
  changePlanStub,
  createCheckoutSessionStub,
  getCurrentPlan,
  getTenantUsage,
  handleStripeWebhookStub,
  usagePercentages,
} from "../services/billing.service";
import { recalculateTenantUsage } from "../services/usage.service";
import { logTenantAudit } from "../services/audit-log.service";

export const getPlan = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const snapshot = await getCurrentPlan({ tenantId });
  const percentages = usagePercentages(snapshot);
  const availablePlans = Object.values(PLAN_DEFINITIONS).map((p) => ({
    planKey: p.planKey,
    displayName: p.displayName,
    priceMonthly: p.priceMonthly,
    priceYearly: p.priceYearly,
    currency: p.currency,
    trialDays: p.trialDays,
    features: p.features,
    limits: p.limits,
  }));
  return successResponse(
    res,
    {
      currentPlan: snapshot,
      billingStatus: snapshot.billingStatus,
      limits: snapshot.limits,
      usage: snapshot.usage,
      usagePercentages: percentages,
      availablePlans,
    },
    "Billing plan"
  );
});

export const postCheckout = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const result = await createCheckoutSessionStub({
    tenantId,
    planKey: req.body.planKey,
    billingCycle: req.body.billingCycle,
  });
  return successResponse(res, result, "Checkout session (stub)");
});

export const postChangePlan = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const snapshot = await changePlanStub({ tenantId, planKey: req.body.planKey, userId: req.user?.id });
  void logTenantAudit(req, "billing.plan.changed", {
    entityType: "Tenant",
    entityId: tenantId,
    message: "Billing plan change (stub)",
    metadata: { planKey: req.body.planKey },
  });
  return successResponse(res, snapshot, "Plan updated (stub)");
});

export const postCancel = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const snapshot = await cancelSubscriptionStub({ tenantId });
  return successResponse(res, snapshot, "Subscription cancel scheduled (stub)");
});

export const postWebhook = asyncHandler(async (req: Request, res) => {
  const result = await handleStripeWebhookStub({ event: req.body as Record<string, unknown> });
  return successResponse(res, result, "Webhook received (stub)");
});

export const getUsage = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const usage = await getTenantUsage({ tenantId });
  return successResponse(res, usage, "Usage");
});

export const postRecalculateUsage = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const recalc = await recalculateTenantUsage({ tenantId });
  const snapshot = await getCurrentPlan({ tenantId });
  return successResponse(
    res,
    { recalculated: recalc, usage: snapshot.usage, usagePercentages: usagePercentages(snapshot) },
    "Usage recalculated"
  );
});
