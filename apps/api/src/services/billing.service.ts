import { createHmac, timingSafeEqual } from "node:crypto";
import { AuditLogModel, StripeEventModel, TenantModel } from "@jobflow/database/models";
import { PLAN_DEFINITIONS, displayPlanToPlanKey, getPlanDefinition, normalizePlanKey, PAID_PLAN_KEYS } from "@jobflow/shared/constants/plans";
import { buildFeatureAccess, buildFeatureGateSnapshot } from "@jobflow/shared/constants/feature-gates";
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
  const normalized = normalizePlanKey(planKey);
  if (normalized === "free") return null;
  if (normalized === "founding_pro") {
    return process.env.STRIPE_PRICE_FOUNDING_PRO_YEARLY?.trim() ?? null;
  }
  const envKey = cycle === "yearly"
    ? `STRIPE_PRICE_${normalized.toUpperCase()}_YEARLY`
    : `STRIPE_PRICE_${normalized.toUpperCase()}`;
  const primary = process.env[envKey]?.trim();
  if (primary) return primary;
  if (normalized === "plus") {
    return (cycle === "yearly" ? process.env.STRIPE_PRICE_STARTER_YEARLY : process.env.STRIPE_PRICE_STARTER)?.trim() ?? null;
  }
  if (normalized === "executive") {
    return (cycle === "yearly" ? process.env.STRIPE_PRICE_AGENCY_YEARLY : process.env.STRIPE_PRICE_AGENCY)?.trim() ?? null;
  }
  return null;
}

function aiCreditsPriceId(pack: "50" | "150"): string | null {
  return process.env[`STRIPE_PRICE_AI_CREDITS_${pack}`]?.trim() ?? null;
}

function buildPriceIdToPlanKeyMap(): Map<string, SubscriptionPlanKey> {
  const map = new Map<string, SubscriptionPlanKey>();
  for (const planKey of [...PAID_PLAN_KEYS, "founding_pro"] as SubscriptionPlanKey[]) {
    for (const cycle of ["monthly", "yearly"] as const) {
      const priceId = planPriceId(planKey, cycle);
      if (priceId) map.set(priceId, planKey);
    }
  }
  const foundingYearly = process.env.STRIPE_PRICE_FOUNDING_PRO_YEARLY?.trim();
  if (foundingYearly) map.set(foundingYearly, "founding_pro");
  return map;
}

const PRICE_ID_TO_PLAN_KEY = buildPriceIdToPlanKeyMap();

function planKeyFromStripePriceId(priceId: string | undefined): SubscriptionPlanKey | null {
  if (!priceId) return null;
  return PRICE_ID_TO_PLAN_KEY.get(priceId) ?? null;
}

export function isStripeBillingConfigured(): boolean {
  return isStripeConfigured();
}

export function getConfiguredStripePlans(): Record<string, { monthly: boolean; yearly: boolean }> {
  const keys: SubscriptionPlanKey[] = ["free", "plus", "pro", "executive", "founding_pro"];
  const out: Record<string, { monthly: boolean; yearly: boolean }> = {};
  for (const planKey of keys) {
    out[planKey] = {
      monthly: Boolean(planPriceId(planKey, "monthly")),
      yearly: Boolean(planPriceId(planKey, "yearly")),
    };
  }
  return out;
}

async function applyPlanToTenant(
  tenantId: string,
  planKey: SubscriptionPlanKey,
  extra?: {
    billingStatus?: BillingStatus;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  }
) {
  const normalized = normalizePlanKey(planKey);
  const def = getPlanDefinition(normalized);
  if (!def) return;

  const billingStatus = extra?.billingStatus ?? "Active";
  const set: Record<string, unknown> = {
    plan: def.displayName,
    billingStatus,
    limits: { ...def.limits },
    "billing.planKey": normalized,
    "billing.billingStatus": billingStatus,
    "billing.featureFlags": def.featureFlags,
  };

  if (extra?.stripeCustomerId) {
    set["billing.stripeCustomerId"] = extra.stripeCustomerId;
    set.stripeCustomerId = extra.stripeCustomerId;
  }
  if (extra?.stripeSubscriptionId) {
    set["billing.stripeSubscriptionId"] = extra.stripeSubscriptionId;
    set.stripeSubscriptionId = extra.stripeSubscriptionId;
  }
  if (extra?.stripePriceId) set["billing.stripePriceId"] = extra.stripePriceId;
  if (extra?.cancelAtPeriodEnd !== undefined) set["billing.cancelAtPeriodEnd"] = extra.cancelAtPeriodEnd;
  if (extra?.currentPeriodStart) set["billing.currentPeriodStart"] = extra.currentPeriodStart;
  if (extra?.currentPeriodEnd) set["billing.currentPeriodEnd"] = extra.currentPeriodEnd;

  await TenantModel.updateOne(tenantQuery(tenantId), { $set: set });
}

function webAppBaseUrl(): string {
  const apiPublic = (process.env.API_PUBLIC_URL ?? process.env.API_URL ?? "").replace(/\/$/, "");
  const candidate = (
    process.env.WEB_APP_URL ??
    process.env.APP_BASE_URL ??
    process.env.APP_URL ??
    "https://newjob.guru"
  ).replace(/\/$/, "");

  // APP_BASE_URL is often mistakenly set to the API Railway URL — Stripe must redirect to the web app.
  if (apiPublic && candidate === apiPublic) {
    return (process.env.WEB_APP_URL ?? "https://newjob.guru").replace(/\/$/, "");
  }
  if (candidate.includes("railway.app") && !process.env.WEB_APP_URL) {
    return "https://newjob.guru";
  }
  return candidate;
}

function tenantQuery(tenantId: string) {
  return { $or: [{ _id: tenantId }, { slug: tenantId }] };
}

function resolvePlanKey(tenant: { plan?: string; billing?: { planKey?: string } }): SubscriptionPlanKey {
  const fromBilling = tenant.billing?.planKey;
  if (fromBilling) return normalizePlanKey(fromBilling);
  const display = tenant.plan;
  if (display && displayPlanToPlanKey[display]) return normalizePlanKey(displayPlanToPlanKey[display]);
  return "free";
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
    maxCvVersions: "cvVersionsCount",
    maxDocuments: "documentsCount",
    maxQuickReviews: "quickReviewsThisMonth",
    maxResearchDocs: "researchDocsThisMonth",
    maxPdfExports: "pdfExportsThisMonth",
  };
  const key = map[limitName];
  return Number(usage[key] ?? 0);
}

export async function getCurrentPlan(input: { tenantId: string }): Promise<TenantBillingSnapshot> {
  const tenantId = assertTenantId(input.tenantId);
  const tenant = await TenantModel.findOne(tenantQuery(tenantId));
  if (!tenant) throw new ApiError("Tenant not found", 404, "TENANT_NOT_FOUND");

  const planKey = resolvePlanKey(tenant);
  const plan = getPlanDefinition(planKey);
  const billingStatus = resolveBillingStatus(tenant);

  const usage: PlanUsage = {
    jobsCount: tenant.usage?.jobsCount ?? 0,
    automationRunsThisMonth: tenant.usage?.automationRunsThisMonth ?? 0,
    aiCreditsUsedThisMonth: tenant.usage?.aiCreditsUsedThisMonth ?? 0,
    purchasedAiCreditsBalance: tenant.usage?.purchasedAiCreditsBalance ?? 0,
    cvVersionsCount: tenant.usage?.cvVersionsCount ?? 0,
    documentsCount: tenant.usage?.documentsCount ?? 0,
    quickReviewsThisMonth: tenant.usage?.quickReviewsThisMonth ?? 0,
    researchDocsThisMonth: tenant.usage?.researchDocsThisMonth ?? 0,
    pdfExportsThisMonth: tenant.usage?.pdfExportsThisMonth ?? 0,
    usersCount: tenant.usage?.usersCount ?? 0,
    storageUsedMb: tenant.usage?.storageUsedMb ?? 0,
    integrationsCount: tenant.usage?.integrationsCount ?? 0,
    reportsGeneratedThisMonth: tenant.usage?.reportsGeneratedThisMonth ?? 0,
  };

  const features = buildFeatureAccess(planKey, billingStatus, plan);

  const periodStart = tenant.billing?.currentPeriodStart;
  const periodEnd = tenant.billing?.currentPeriodEnd;

  return {
    planKey,
    displayName: plan.displayName,
    billingStatus,
    plan,
    limits: plan.limits,
    usage,
    features,
    stripeCustomerId: tenant.billing?.stripeCustomerId ?? tenant.stripeCustomerId,
    stripeSubscriptionId: tenant.billing?.stripeSubscriptionId ?? tenant.stripeSubscriptionId,
    stripePriceId: tenant.billing?.stripePriceId,
    purchasedAiCreditsBalance: usage.purchasedAiCreditsBalance,
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

export async function getFeatureGates(input: { tenantId: string }) {
  const snapshot = await getCurrentPlan(input);
  return buildFeatureGateSnapshot({
    planKey: snapshot.planKey,
    billingStatus: snapshot.billingStatus,
    plan: snapshot.plan,
    usage: snapshot.usage,
  });
}

export async function createAiCreditsCheckout(input: {
  tenantId: string;
  pack: "50" | "150";
}): Promise<CheckoutResult> {
  assertTenantId(input.tenantId);
  if (!isStripeConfigured()) {
    throw new ApiError("Billing is not configured.", 503, "BILLING_NOT_CONFIGURED");
  }
  const priceId = aiCreditsPriceId(input.pack);
  if (!priceId) {
    throw new ApiError(`No Stripe price for AI credits pack ${input.pack}.`, 503, "BILLING_NOT_CONFIGURED");
  }

  const tenant = await TenantModel.findOne(tenantQuery(input.tenantId)).lean() as Record<string, unknown> | null;
  const appBaseUrl = webAppBaseUrl();
  const settingsReturn = `${appBaseUrl}/settings?section=Billing`;

  const params: Record<string, string> = {
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    mode: "payment",
    success_url: `${settingsReturn}&checkout=credits_success`,
    cancel_url: `${settingsReturn}&checkout=cancelled`,
    client_reference_id: input.tenantId,
    "metadata[tenantId]": input.tenantId,
    "metadata[creditsPack]": input.pack,
  };

  const billing = (tenant?.billing ?? {}) as Record<string, unknown>;
  const existingCustomerId = String(billing.stripeCustomerId ?? tenant?.stripeCustomerId ?? "");
  if (existingCustomerId) params.customer = existingCustomerId;

  const session = await stripeRequest<{ id: string; url: string }>("POST", "/checkout/sessions", params);
  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    planKey: "free",
    status: "open",
  };
}

export async function createCheckoutSession(input: {
  tenantId: string;
  planKey: SubscriptionPlanKey;
  billingCycle: "monthly" | "yearly";
}): Promise<CheckoutResult> {
  assertTenantId(input.tenantId);
  const normalized = normalizePlanKey(input.planKey);
  if (normalized === "free") throw new ApiError("Cannot checkout free plan", 422, "VALIDATION_ERROR");
  const def = getPlanDefinition(normalized);
  if (!def) throw new ApiError("Invalid planKey", 422, "VALIDATION_ERROR");

  if (!isStripeConfigured()) {
    throw new ApiError(
      "Billing is not configured. Contact support to set up your billing account.",
      503,
      "BILLING_NOT_CONFIGURED"
    );
  }

  const priceId = planPriceId(normalized, input.billingCycle);
  if (!priceId) {
    throw new ApiError(
      `No Stripe price ID configured for plan "${normalized}" (${input.billingCycle}).`,
      503,
      "BILLING_NOT_CONFIGURED"
    );
  }

  const tenant = await TenantModel.findOne({ $or: [{ _id: input.tenantId }, { slug: input.tenantId }] }).lean() as Record<string, unknown> | null;
  const appBaseUrl = webAppBaseUrl();
  const settingsReturn = `${appBaseUrl}/settings?section=Billing`;

  const params: Record<string, string> = {
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    mode: "subscription",
    success_url: `${settingsReturn}&checkout=success`,
    cancel_url: `${settingsReturn}&checkout=cancelled`,
    client_reference_id: input.tenantId,
    "metadata[tenantId]": input.tenantId,
    "metadata[planKey]": normalized,
    "metadata[billingCycle]": input.billingCycle,
    "subscription_data[metadata][tenantId]": input.tenantId,
    "subscription_data[metadata][planKey]": normalized,
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
    planKey: normalized,
    status: "open",
  };
}

export async function changePlanDirect(input: { tenantId: string; planKey: SubscriptionPlanKey; userId?: string }) {
  const tenantId = assertTenantId(input.tenantId);
  const def = PLAN_DEFINITIONS[input.planKey];
  if (!def) throw new ApiError("Invalid planKey", 422, "VALIDATION_ERROR");

  if (isStripeConfigured() && process.env.ALLOW_DIRECT_PLAN_CHANGE !== "true") {
    throw new ApiError(
      "Plan changes must go through Stripe checkout when billing is enabled.",
      422,
      "USE_STRIPE_CHECKOUT"
    );
  }

  await applyPlanToTenant(tenantId, input.planKey, { billingStatus: "Active" });

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

  if (eventId !== "unknown") {
    const duplicate = await StripeEventModel.findOne({ eventId }).lean();
    if (duplicate) return { received: true, eventId, eventType, handled: true, duplicate: true };
  }

  const markProcessed = async () => {
    if (eventId !== "unknown") {
      await StripeEventModel.create({ eventId, eventType }).catch(() => undefined);
    }
  };

  switch (eventType) {
    case "checkout.session.completed": {
      const metadata = (data.metadata ?? {}) as Record<string, string>;
      const tenantId = String(metadata.tenantId ?? data.client_reference_id ?? "");
      const mode = String(data.mode ?? "subscription");

      if (mode === "payment" && metadata.creditsPack) {
        const pack = metadata.creditsPack === "150" ? 150 : 50;
        if (tenantId) {
          await TenantModel.updateOne(tenantQuery(tenantId), {
            $inc: { "usage.purchasedAiCreditsBalance": pack },
          });
        }
        await markProcessed();
        break;
      }

      const planKey = normalizePlanKey(String(metadata.planKey ?? ""));
      const customerId = String(data.customer ?? "");
      const subscriptionId = String(data.subscription ?? "");
      if (!tenantId || planKey === "free") break;
      await applyPlanToTenant(tenantId, planKey, {
        billingStatus: "Active",
        stripeCustomerId: customerId || undefined,
        stripeSubscriptionId: subscriptionId || undefined,
        cancelAtPeriodEnd: false,
      });
      await markProcessed();
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const customerId = String(data.customer ?? "");
      const subscriptionId = String(data.id ?? "");
      const cancelAtPeriodEnd = Boolean(data.cancel_at_period_end);
      const rawStatus = String(data.status ?? "");
      const billingStatus: BillingStatus =
        rawStatus === "active"
          ? "Active"
          : rawStatus === "trialing"
            ? "Trialing"
            : rawStatus === "past_due"
              ? "Past Due"
              : rawStatus === "canceled"
                ? "Cancelled"
                : "Cancelled";
      const periodStart = data.current_period_start ? new Date(Number(data.current_period_start) * 1000) : undefined;
      const periodEnd = data.current_period_end ? new Date(Number(data.current_period_end) * 1000) : undefined;
      const subMetadata = (data.metadata ?? {}) as Record<string, string>;
      const items = (data.items as { data?: Array<{ price?: { id?: string } }> } | undefined)?.data ?? [];
      const priceId = items[0]?.price?.id;
      const planKey =
        planKeyFromStripePriceId(priceId) ??
        (subMetadata.planKey as SubscriptionPlanKey | undefined) ??
        null;

      const filter = subscriptionId
        ? { "billing.stripeSubscriptionId": subscriptionId }
        : customerId
          ? { "billing.stripeCustomerId": customerId }
          : null;
      if (!filter) break;

      const tenant = await TenantModel.findOne(filter).lean() as Record<string, unknown> | null;
      const tenantId = String(tenant?._id ?? "");
      if (!tenantId) break;

      const resolvedPlanKey =
        planKey && PLAN_DEFINITIONS[planKey]
          ? planKey
          : resolvePlanKey((tenant ?? {}) as { plan?: string; billing?: { planKey?: string } });

      await applyPlanToTenant(tenantId, resolvedPlanKey, {
        billingStatus: cancelAtPeriodEnd && billingStatus === "Active" ? "Active" : billingStatus,
        stripeCustomerId: customerId || undefined,
        stripeSubscriptionId: subscriptionId || undefined,
        stripePriceId: priceId,
        cancelAtPeriodEnd,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });
      await markProcessed();
      break;
    }
    case "customer.subscription.deleted": {
      const subscriptionId = String(data.id ?? "");
      const tenant = await TenantModel.findOne({ "billing.stripeSubscriptionId": subscriptionId }).lean() as Record<string, unknown> | null;
      const tenantId = String(tenant?._id ?? "");
      if (!tenantId) break;
      await applyPlanToTenant(tenantId, "free", {
        billingStatus: "Cancelled",
        cancelAtPeriodEnd: false,
      });
      await markProcessed();
      break;
    }
    case "invoice.payment_succeeded": {
      const customerId = String(data.customer ?? "");
      if (customerId) {
        await TenantModel.updateOne({ "billing.stripeCustomerId": customerId }, {
          $set: { billingStatus: "Active", "billing.billingStatus": "Active" },
        });
      }
      await markProcessed();
      break;
    }
    case "invoice.payment_failed": {
      const customerId = String(data.customer ?? "");
      await TenantModel.updateOne({ "billing.stripeCustomerId": customerId }, {
        $set: { billingStatus: "Past Due", "billing.billingStatus": "Past Due" },
      });
      await markProcessed();
      break;
    }
    case "customer.subscription.trial_will_end": {
      await markProcessed();
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
  const appBaseUrl = webAppBaseUrl();
  const session = await stripeRequest<{ url: string }>("POST", "/billing_portal/sessions", {
    customer: customerId,
    return_url: `${appBaseUrl}/settings?section=Billing`,
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
