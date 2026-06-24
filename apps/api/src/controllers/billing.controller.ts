import { PAID_PLAN_KEYS, getPlanDefinition } from "@jobflow/shared/constants/plans";
import type { SubscriptionPlanKey } from "@jobflow/shared/types/billing";
import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { assertTenantId } from "../services/baseTenant.service";
import {
  cancelSubscription,
  changePlanDirect,
  createAiCreditsCheckout,
  createCheckoutSession,
  createBillingPortalSession,
  getConfiguredStripePlans,
  getCurrentPlan,
  getFeatureGates,
  getTenantUsage,
  handleStripeWebhook,
  isStripeBillingConfigured,
  verifyStripeWebhookSignature,
  usagePercentages,
} from "../services/billing.service";
import { recalculateTenantUsage } from "../services/usage.service";
import { logTenantAudit } from "../services/audit-log.service";

export const getPlan = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const snapshot = await getCurrentPlan({ tenantId });
  const percentages = usagePercentages(snapshot);
  const stripeConfigured = isStripeBillingConfigured();
  const stripePrices = getConfiguredStripePlans();
  const catalogKeys: SubscriptionPlanKey[] = ["free", ...PAID_PLAN_KEYS];
  const availablePlans = catalogKeys.map((planKey) => {
    const p = getPlanDefinition(planKey);
    return {
      planKey: p.planKey,
      displayName: p.displayName,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      currency: p.currency,
      trialDays: p.trialDays,
      badge: p.badge,
      tagline: p.tagline,
      features: p.features,
      limits: p.limits,
      purchasableMonthly: Boolean(stripePrices[p.planKey]?.monthly),
      purchasableYearly: Boolean(stripePrices[p.planKey]?.yearly),
    };
  });
  const featureGates = await getFeatureGates({ tenantId });
  return successResponse(
    res,
    {
      currentPlan: snapshot,
      billingStatus: snapshot.billingStatus,
      limits: snapshot.limits,
      usage: snapshot.usage,
      features: snapshot.features,
      featureGates,
      usagePercentages: percentages,
      availablePlans,
      stripeConfigured,
      billingNotice: stripeConfigured ? null : "Billing is not configured. Contact support to set up your billing account.",
      taxNotice: "Prices include VAT where applicable. Taxes may be calculated at checkout depending on your location.",
    },
    "Billing plan"
  );
});

export const postCheckout = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const result = await createCheckoutSession({
    tenantId,
    planKey: req.body.planKey,
    billingCycle: req.body.billingCycle,
  });
  return successResponse(res, result, "Checkout session");
});

export const postCreditsCheckout = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const result = await createAiCreditsCheckout({ tenantId, pack: req.body.pack });
  return successResponse(res, result, "AI credits checkout session");
});

export const getFeatureGatesHandler = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const gates = await getFeatureGates({ tenantId });
  return successResponse(res, gates, "Feature gates");
});

export const postBillingPortal = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const result = await createBillingPortalSession({ tenantId });
  return successResponse(res, result, "Billing portal session");
});

export const postChangePlan = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const snapshot = await changePlanDirect({ tenantId, planKey: req.body.planKey, userId: req.user?.id });
  void logTenantAudit(req, "billing.plan.changed", {
    entityType: "Tenant",
    entityId: tenantId,
    message: "Billing plan changed",
    metadata: { planKey: req.body.planKey },
  });
  return successResponse(res, snapshot, "Plan updated");
});

export const postCancel = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const snapshot = await cancelSubscription({ tenantId });
  return successResponse(res, snapshot, "Subscription cancel scheduled");
});

export const postWebhook = asyncHandler(async (req: Request, res) => {
  const signature = req.headers["stripe-signature"] as string | undefined;
  if (signature) {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));
    const verify = verifyStripeWebhookSignature({ rawBody, signature });
    if (!verify.verified) {
      res.status(400).json({ error: verify.error ?? "Invalid webhook signature" });
      return;
    }
  }
  const result = await handleStripeWebhook({ event: req.body as Record<string, unknown> });
  return successResponse(res, result, "Webhook received");
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
