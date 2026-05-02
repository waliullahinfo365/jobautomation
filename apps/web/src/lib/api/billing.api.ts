import { apiFetch } from "./client";

export type BillingPlanResponse = {
  currentPlan: {
    planKey: string;
    displayName: string;
    billingStatus: string;
    limits: Record<string, number | string>;
    usage: Record<string, number>;
  };
  billingStatus: string;
  limits: Record<string, number | string>;
  usage: Record<string, number>;
  usagePercentages: Record<string, { current: number; limit: number | string; percent: number | null }>;
  availablePlans: Array<{ planKey: string; displayName: string; priceMonthly: number; priceYearly: number; currency: string }>;
};

export function getBillingPlan() { return apiFetch<BillingPlanResponse>("/billing/plan"); }
export function createCheckout(payload: { planKey: string; billingCycle: "monthly" | "yearly" }) { return apiFetch("/billing/checkout", { method: "POST", body: payload }); }
export function changePlan(payload: { planKey: string }) { return apiFetch("/billing/change-plan", { method: "POST", body: payload }); }
export function cancelSubscription() { return apiFetch("/billing/cancel", { method: "POST", body: {} }); }
export function getBillingUsage() { return apiFetch("/billing/usage"); }
export function recalculateUsage() { return apiFetch("/billing/recalculate-usage", { method: "POST", body: {} }); }
