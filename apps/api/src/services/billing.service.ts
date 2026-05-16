import { createHmac, timingSafeEqual } from "node:crypto";
import { AuditLogModel, TenantModel } from "@jobflow/database/models";
import { PLAN_DEFINITIONS, displayPlanToPlanKey } from "@jobflow/shared/constants/plans";
import type {
  BillingStatus,
  CheckoutResult,
  PlanLimitCheckResult,
  PlanLimitName,
  PlanUsage,
  SubscriptionPlanKey,
  TenantBillingSnapshot,
} from "@jobflow/shared/types/billing";
import { assertTenantId } from "./baseTenant.service";
import { ApiError } from "../utils/errors";

// ─── Stripe configuration helpers ─────────────────────────────────────────────

function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

function stripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new ApiError("Stripe billing is not configured. Set STRIPE_SECRET_KEY.", 503, "BILLING_NOT_CONFIGURED");
  return key;
}

function stripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? null;
}

/** Minimal raw HTTP client for Stripe API */
async function stripeRequest<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: Record<string, string>
): Promise<T> {
  const key = stripeSecretKey();
  const url = `https://api.stripe.com/v1${path}`;
  const encoded = body ? new URLSearchParams(body).toString() : undefined;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2023-10-16",
    },
    ...(encoded ? { body: encoded } : {}),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg = (json.error as { message?: string } | undefined)?.message ?? `Stripe HTTP ${res.status}`;
    throw new ApiError(msg.slice(0, 300), res.status >= 500 ? 502 : 422, "STRIPE_ERROR");
  }
  return json as T;
}

function planPriceId(planKey: SubscriptionPlanKey, cycle: "monthly" | "yearly"): string | null {
  const envKey = cycle === "yearly"
    ? `STRIPE_PRICE_${planKey.toUpperCase()}_YEARLY`
    : `STRIPE_PRICE_${planKey.toUpperCase()}`;
  return process.env[envKey]?.trim() ?? process.env[`STRIPE_PRICE_${planKey.toUpperCase()}`]?.trim() ?? null;
}

function tenantQuery(tenantId: string) {
  return { $or: [{ _id: tenantId }, { slug: tenantId }] };
}

function resolvePlanKey(tenant: { plan?: string; billing?: { planKey?: string } }): SubscriptionPlanKey {
  const fromBilling = tenant.billing?.planKey as SubscriptionPlanKey | undefined;
  if (fromBilling && PLAN_DEFINITIONS[fromBilling]) return fromBilling;
  const display = tenant.plan as keyof typeof displayPlanToPlanKey | undefined;
  if (display && displayPlanToPlanKey[display]) return displayPlanToPlanKey[display];
  return "free_trial";
}

function resolveBillingStatus(tenant: { billingStatus?: string; billing?: { billingStatus?: string } }): BillingStatus {
  const nested = tenant.billing?.billingStatus as BillingStatus | undefined;
  if (nested) return nested;
  return (tenant.billingStatus as BillingStatus) ?? "Trialing";
}

function isUnlimitedLimit(value: unknown): boolean {
  return value === "unlimited" || value === "custom";
}

function numericLimit(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (isUnlimitedLimit(value)) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function usageForMetric(usage: Record<string, number | undefined>, limitName: PlanLimitName): number {
  const map: Record<PlanLimitName, keyof PlanUsage> = {
    maxJobs: "jobsCount",
    maxAutomationRuns: "automationRunsThisMonth",
    maxAiCredits: "aiCreditsUsedThisMonth",
    maxUsers: "usersCount",
    maxStorageMb: "storageUsedMb",
    maxIntegrations: "integrationsCount",
    maxReportsPerMonth: "reportsGeneratedThisMonth",
  };
  const key = map[limitName];
  return Number(usage[key] ?? 0);
}

export async function getCurrentPlan(input: { tenantId: string }): Promise<TenantBillingSnapshot> {
  const tenantId = assertTenantId(input.tenantId);
  const tenant = await TenantModel.findOne(tenantQuery(tenantId));
  if (!tenant) throw new ApiError("Tenant not found", 404, "TENANT_NOT_FOUND");

  const planKey = resolvePlanKey(tenant);
  const plan = PLAN_DEFINITIONS[planKey];
  const billingStatus = resolveBillingStatus(tenant);

  const usage: PlanUsage = {
    jobsCount: tenant.usage?.jobsCount ?? 0,
    automationRunsThisMonth: tenant.usage?.automationRunsThisMonth ?? 0,
    aiCreditsUsedThisMonth: tenant.usage?.aiCreditsUsedThisMonth ?? 0,
    usersCount: tenant.usage?.usersCount ?? 0,
    storageUsedMb: tenant.usage?.storageUsedMb ?? 0,
    integrationsCount: tenant.usage?.integrationsCount ?? 0,
    reportsGeneratedThisMonth: tenant.usage?.reportsGeneratedThisMonth ?? 0,
  };

  const periodStart = tenant.billing?.currentPeriodStart;
  const periodEnd = tenant.billing?.currentPeriodEnd;

  return {
    planKey,
    displayName: plan.displayName,
    billingStatus,
    plan,
    limits: plan.limits,
    usage,
    stripeCustomerId: tenant.billing?.stripeCustomerId ?? tenant.stripeCustomerId,
    stripeSubscriptionId: tenant.billing?.stripeSubscriptionId ?? tenant.stripeSubscriptionId,
    currentPeriodStart: periodStart instanceof Date ? periodStart.toISOString() : undefined,
    currentPeriodEnd: periodEnd instanceof Date ? periodEnd.toISOString() : undefined,
    cancelAtPeriodEnd: tenant.billing?.cancelAtPeriodEnd ?? false,
  };
}

export async function getTenantUsage(input: { tenantId: string }): Promise<PlanUsage & { tenantId: string }> {
  const snapshot = await getCurrentPlan(input);
  return { tenantId: input.tenantId, ...snapshot.usage };
}

export async function checkPlanLimit(input: {
  tenantId: string;
  limitName: PlanLimitName;
  incrementBy?: number;
}): Promise<PlanLimitCheckResult> {
  const tenantId = assertTenantId(input.tenantId);
  const tenant = await TenantModel.findOne(tenantQuery(tenantId));
  if (!tenant) throw new ApiError("Tenant not found", 404, "TENANT_NOT_FOUND");

  const planKey = resolvePlanKey(tenant);
  const incrementBy = input.incrementBy ?? 0;

  const tenantLimits = tenant.limits as Record<string, unknown> | undefined;
  const limitRaw = tenantLimits?.[input.limitName] ?? PLAN_DEFINITIONS[planKey].limits[input.limitName];
  const limitCap = numericLimit(limitRaw);

  const currentUsage = usageForMetric((tenant.usage ?? {}) as Record<string, number | undefined>, input.limitName);

  if (limitCap === null) {
    return {
      allowed: true,
      limitName: input.limitName,
      currentUsage,
      limit: Number.POSITIVE_INFINITY,
      planKey,
    };
  }

  const allowed = currentUsage + incrementBy <= limitCap;
  return {
    allowed,
    reason: allowed ? undefined : "Plan limit reached. Upgrade your plan to continue.",
    limitName: input.limitName,
    currentUsage,
    limit: limitCap,
    planKey,
  };
}

export async function createCheckoutSession(input: {
  tenantId: string;
  planKey: SubscriptionPlanKey;
  billingCycle: "monthly" | "yearly";
}): Promise<CheckoutResult> {
  assertTenantId(input.tenantId);
  if (!PLAN_DEFINITIONS[input.planKey]) throw new ApiError("Invalid planKey", 422, "VALIDATION_ERROR");

  if (!isStripeConfigured()) {
    throw new ApiError(
      "Billing is not configured. Contact support to set up your billing account.",
      503,
      "BILLING_NOT_CONFIGURED"
    );
  }

  const priceId = planPriceId(input.planKey, input.billingCycle);
  if (!priceId) {
    throw new ApiError(
      `No Stripe price ID configured for plan "${input.planKey}" (${input.billingCycle}). Set STRIPE_PRICE_${input.planKey.toUpperCase()} in environment.`,
      503,
      "BILLING_NOT_CONFIGURED"
    );
  }

  const tenant = await TenantModel.findOne({ $or: [{ _id: input.tenantId }, { slug: input.tenantId }] }).lean() as Record<string, unknown> | null;
  const appBaseUrl = process.env.APP_BASE_URL ?? "https://newjob.guru";

  const params: Record<string, string> = {
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    mode: "subscription",
    success_url: `${appBaseUrl}/billing?checkout=success&plan=${input.planKey}`,
    cancel_url: `${appBaseUrl}/billing?checkout=cancelled`,
    "metadata[tenantId]": input.tenantId,
    "metadata[planKey]": input.planKey,
  };

  // Attach existing Stripe customer if available
  const billing = (tenant?.billing ?? {}) as Record<string, unknown>;
  const existingCustomerId = String(billing.stripeCustomerId ?? tenant?.stripeCustomerId ?? "");
  if (existingCustomerId) {
    params.customer = existingCustomerId;
  }

  const session = await stripeRequest<{ id: string; url: string }>("POST", "/checkout/sessions", params);

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    planKey: input.planKey,
    status: "open",
  };
}

export async function changePlanDirect(input: { tenantId: string; planKey: SubscriptionPlanKey; userId?: string }) {
  const tenantId = assertTenantId(input.tenantId);
  const def = PLAN_DEFINITIONS[input.planKey];
  if (!def) throw new ApiError("Invalid planKey", 422, "VALIDATION_ERROR");

  await TenantModel.updateOne(tenantQuery(tenantId), {
    $set: {
      plan: def.displayName,
      billingStatus: "Active",
      "billing.planKey": input.planKey,
      "billing.billingStatus": "Active",
      limits: {
        maxJobs: def.limits.maxJobs,
        maxAutomationRuns: def.limits.maxAutomationRuns,
        maxAiCredits: def.limits.maxAiCredits,
        maxUsers: def.limits.maxUsers,
        maxStorageMb: def.limits.maxStorageMb,
        maxIntegrations: def.limits.maxIntegrations,
        maxReportsPerMonth: def.limits.maxReportsPerMonth,
      },
    },
  });

  await AuditLogModel.create({
    tenantId,
    createdBy: input.userId ?? "system",
    action: "billing.plan_changed",
    entityType: "Tenant",
    entityId: tenantId,
    message: `Plan changed to ${input.planKey}`,
    metadata: { planKey: input.planKey },
  });

  return getCurrentPlan({ tenantId });
}

export async function cancelSubscription(input: { tenantId: string }) {
  const tenantId = assertTenantId(input.tenantId);
  const tenant = await TenantModel.findOne(tenantQuery(tenantId)).lean() as Record<string, unknown> | null;
  const billing = (tenant?.billing ?? {}) as Record<string, unknown>;
  const subscriptionId = String(billing.stripeSubscriptionId ?? tenant?.stripeSubscriptionId ?? "");

  if (isStripeConfigured() && subscriptionId) {
    await stripeRequest("POST", `/subscriptions/${subscriptionId}`, { cancel_at_period_end: "true" });
  }

  await TenantModel.updateOne(tenantQuery(tenantId), {
    $set: {
      "billing.cancelAtPeriodEnd": true,
      billingStatus: "Cancelled",
      "billing.billingStatus": "Cancelled",
    },
  });
  return getCurrentPlan({ tenantId });
}

export function verifyStripeWebhookSignature(input: {
  rawBody: Buffer | string;
  signature: string;
}): { verified: boolean; error?: string } {
  const webhookSecret = stripeWebhookSecret();
  if (!webhookSecret) return { verified: true }; // No secret = skip verification (dev only)

  const parts = input.signature.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k] = v;
    return acc;
  }, {});
  const timestamp = parts["t"];
  const sig = parts["v1"];
  if (!timestamp || !sig) return { verified: false, error: "Missing webhook signature components" };

  const body = typeof input.rawBody === "string" ? input.rawBody : input.rawBody.toString("utf8");
  const payload = `${timestamp}.${body}`;
  const expected = createHmac("sha256", webhookSecret).update(payload, "utf8").digest("hex");
  const tolerance = 300; // 5 minutes
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (age > tolerance) return { verified: false, error: "Webhook timestamp too old" };

  try {
    if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"))) {
      return { verified: false, error: "Webhook signature mismatch" };
    }
  } catch {
    return { verified: false, error: "Webhook signature verification failed" };
  }
  return { verified: true };
}

export async function handleStripeWebhook(input: { event: Record<string, unknown> }) {
  const eventType = String(input.event?.type ?? "");
  const eventId = String(input.event?.id ?? "unknown");
  const data = (input.event?.data as Record<string, unknown> | undefined)?.object as Record<string, unknown> | undefined;

  if (!data) return { received: true, eventId, eventType, handled: false, reason: "no data object" };

  switch (eventType) {
    case "checkout.session.completed": {
      const tenantId = String((data.metadata as Record<string, string> | undefined)?.tenantId ?? "");
      const planKey = String((data.metadata as Record<string, string> | undefined)?.planKey ?? "") as SubscriptionPlanKey;
      const customerId = String(data.customer ?? "");
      const subscriptionId = String(data.subscription ?? "");
      if (!tenantId || !planKey || !PLAN_DEFINITIONS[planKey]) break;
      const def = PLAN_DEFINITIONS[planKey];
      await TenantModel.updateOne(tenantQuery(tenantId), {
        $set: {
          plan: def.displayName,
          billingStatus: "Active",
          "billing.planKey": planKey,
          "billing.billingStatus": "Active",
          "billing.stripeCustomerId": customerId,
          "billing.stripeSubscriptionId": subscriptionId,
          "billing.cancelAtPeriodEnd": false,
        },
      });
      break;
    }
    case "customer.subscription.updated": {
      const customerId = String(data.customer ?? "");
      const subscriptionId = String(data.id ?? "");
      const cancelAtPeriodEnd = Boolean(data.cancel_at_period_end);
      const rawStatus = String(data.status ?? "");
      const billingStatus: BillingStatus = rawStatus === "active" ? "Active" : rawStatus === "trialing" ? "Trialing" : rawStatus === "past_due" ? "Past Due" : "Cancelled";
      const periodStart = data.current_period_start ? new Date(Number(data.current_period_start) * 1000) : undefined;
      const periodEnd = data.current_period_end ? new Date(Number(data.current_period_end) * 1000) : undefined;
      const update: Record<string, unknown> = {
        billingStatus,
        "billing.billingStatus": billingStatus,
        "billing.stripeCustomerId": customerId,
        "billing.stripeSubscriptionId": subscriptionId,
        "billing.cancelAtPeriodEnd": cancelAtPeriodEnd,
      };
      if (periodStart) { update["billing.currentPeriodStart"] = periodStart; }
      if (periodEnd) { update["billing.currentPeriodEnd"] = periodEnd; }
      await TenantModel.updateOne({ "billing.stripeSubscriptionId": subscriptionId }, { $set: update });
      break;
    }
    case "customer.subscription.deleted": {
      const subscriptionId = String(data.id ?? "");
      await TenantModel.updateOne({ "billing.stripeSubscriptionId": subscriptionId }, {
        $set: {
          billingStatus: "Cancelled",
          "billing.billingStatus": "Cancelled",
          "billing.cancelAtPeriodEnd": false,
          plan: PLAN_DEFINITIONS["free_trial"].displayName,
          "billing.planKey": "free_trial",
        },
      });
      break;
    }
    case "invoice.payment_failed": {
      const customerId = String(data.customer ?? "");
      await TenantModel.updateOne({ "billing.stripeCustomerId": customerId }, {
        $set: { billingStatus: "Past Due", "billing.billingStatus": "Past Due" },
      });
      break;
    }
    default:
      return { received: true, eventId, eventType, handled: false };
  }

  return { received: true, eventId, eventType, handled: true };
}

export async function createBillingPortalSession(input: { tenantId: string }): Promise<{ portalUrl: string }> {
  assertTenantId(input.tenantId);
  if (!isStripeConfigured()) {
    throw new ApiError("Billing is not configured. Set STRIPE_SECRET_KEY.", 503, "BILLING_NOT_CONFIGURED");
  }
  const tenant = await TenantModel.findOne(tenantQuery(input.tenantId)).lean() as Record<string, unknown> | null;
  const billing = (tenant?.billing ?? {}) as Record<string, unknown>;
  const customerId = String(billing.stripeCustomerId ?? tenant?.stripeCustomerId ?? "");
  if (!customerId) {
    throw new ApiError("No Stripe customer found. Complete a checkout first.", 422, "NO_STRIPE_CUSTOMER");
  }
  const appBaseUrl = process.env.APP_BASE_URL ?? "https://newjob.guru";
  const session = await stripeRequest<{ url: string }>("POST", "/billing_portal/sessions", {
    customer: customerId,
    return_url: `${appBaseUrl}/settings?section=billing`,
  });
  return { portalUrl: session.url };
}


export function usagePercentages(snapshot: TenantBillingSnapshot): Record<string, { current: number; limit: number | string; percent: number | null }> {
  const out: Record<string, { current: number; limit: number | string; percent: number | null }> = {};
  const pairs: [PlanLimitName, keyof PlanUsage][] = [
    ["maxJobs", "jobsCount"],
    ["maxAutomationRuns", "automationRunsThisMonth"],
    ["maxAiCredits", "aiCreditsUsedThisMonth"],
    ["maxUsers", "usersCount"],
    ["maxStorageMb", "storageUsedMb"],
    ["maxIntegrations", "integrationsCount"],
    ["maxReportsPerMonth", "reportsGeneratedThisMonth"],
  ];
  for (const [limitName, usageKey] of pairs) {
    const lim = snapshot.limits[limitName];
    const current = snapshot.usage[usageKey];
    if (lim === "unlimited") {
      out[limitName] = { current, limit: "unlimited", percent: null };
    } else {
      const cap = typeof lim === "number" ? lim : 0;
      const percent = cap > 0 ? Math.min(100, Math.round((current / cap) * 1000) / 10) : 0;
      out[limitName] = { current, limit: cap, percent };
    }
  }
  return out;
}
