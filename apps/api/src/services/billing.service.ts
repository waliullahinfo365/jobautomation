import { randomUUID } from "node:crypto";
import { AuditLogModel, TenantModel } from "@database/models";
import { PLAN_DEFINITIONS, displayPlanToPlanKey } from "@shared/constants/plans";
import type {
  BillingStatus,
  CheckoutResult,
  PlanLimitCheckResult,
  PlanLimitName,
  PlanUsage,
  SubscriptionPlanKey,
  TenantBillingSnapshot,
} from "@shared/types/billing";
import { assertTenantId } from "./baseTenant.service";
import { ApiError } from "../utils/errors";

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

export async function createCheckoutSessionStub(input: {
  tenantId: string;
  planKey: SubscriptionPlanKey;
  billingCycle: "monthly" | "yearly";
}): Promise<CheckoutResult> {
  assertTenantId(input.tenantId);
  if (!PLAN_DEFINITIONS[input.planKey]) throw new ApiError("Invalid planKey", 422, "VALIDATION_ERROR");
  const sessionId = `stub_cs_${randomUUID()}`;
  return {
    checkoutUrl: `https://billing.example.local/checkout/${sessionId}`,
    sessionId,
    planKey: input.planKey,
    status: "stub_open",
  };
}

export async function changePlanStub(input: { tenantId: string; planKey: SubscriptionPlanKey; userId?: string }) {
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

export async function cancelSubscriptionStub(input: { tenantId: string }) {
  const tenantId = assertTenantId(input.tenantId);
  await TenantModel.updateOne(tenantQuery(tenantId), {
    $set: {
      "billing.cancelAtPeriodEnd": true,
      billingStatus: "Cancelled",
      "billing.billingStatus": "Cancelled",
    },
  });
  return getCurrentPlan({ tenantId });
}

export async function handleStripeWebhookStub(input: { event: Record<string, unknown> }) {
  return {
    received: true,
    mode: "stub",
    eventId: String(input.event?.id ?? input.event?.type ?? "unknown"),
    message: "Stripe webhook stub: no payment processing",
  };
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
