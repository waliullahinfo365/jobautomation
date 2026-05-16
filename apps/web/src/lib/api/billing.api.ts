import { apiFetch } from "./client";

export type AvailablePlan = {
  planKey: string;
  displayName: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features?: string[];
  limits?: Record<string, number | string>;
};

export type BillingPlanResponse = {
  currentPlan: {
    planKey: string;
    displayName: string;
    billingStatus: string;
    limits: Record<string, number | string>;
    usage: Record<string, number>;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: string;
  };
  billingStatus: string;
  limits: Record<string, number | string>;
  usage: Record<string, number>;
  usagePercentages: Record<string, { current: number; limit: number | string; percent: number | null }>;
  availablePlans: AvailablePlan[];
  stripeConfigured: boolean;
  billingNotice: string | null;
};

export type CheckoutResult = { checkoutUrl: string; sessionId: string; planKey: string; status: string };
export type PortalResult = { portalUrl: string };

export function getBillingPlan() { return apiFetch<BillingPlanResponse>("/billing/plan"); }
export function createCheckout(payload: { planKey: string; billingCycle: "monthly" | "yearly" }) { return apiFetch<CheckoutResult>("/billing/checkout", { method: "POST", body: payload }); }
export function openBillingPortal() { return apiFetch<PortalResult>("/billing/portal", { method: "POST", body: {} }); }
export function changePlan(payload: { planKey: string }) { return apiFetch("/billing/change-plan", { method: "POST", body: payload }); }
export function cancelSubscription() { return apiFetch("/billing/cancel", { method: "POST", body: {} }); }
export function getBillingUsage() { return apiFetch("/billing/usage"); }
export function recalculateUsage() { return apiFetch("/billing/recalculate-usage", { method: "POST", body: {} }); }
