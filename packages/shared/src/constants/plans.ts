import type { PlanDefinition, SubscriptionPlanKey } from "../types/billing";

export const subscriptionPlans = ["Free Trial", "Starter", "Pro", "Agency", "Enterprise"] as const;
export const tenantRoles = ["Owner", "Admin", "Member", "Viewer"] as const;

export const PLAN_DEFINITIONS: Record<SubscriptionPlanKey, PlanDefinition> = {
  free_trial: {
    planKey: "free_trial",
    displayName: "Free Trial",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "USD",
    trialDays: 14,
    features: ["Core job tracking", "Limited automations", "Email intake stub"],
    limits: {
      maxJobs: 25,
      maxAutomationRuns: 100,
      maxAiCredits: 50,
      maxUsers: 1,
      maxStorageMb: 100,
      maxIntegrations: 2,
      maxReportsPerMonth: 10,
    },
  },
  starter: {
    planKey: "starter",
    displayName: "Starter",
    priceMonthly: 29,
    priceYearly: 290,
    currency: "USD",
    trialDays: 0,
    features: ["Everything in trial", "Higher limits", "Priority email support (stub)"],
    limits: {
      maxJobs: 100,
      maxAutomationRuns: 1000,
      maxAiCredits: 300,
      maxUsers: 2,
      maxStorageMb: 1000,
      maxIntegrations: 5,
      maxReportsPerMonth: 50,
    },
  },
  pro: {
    planKey: "pro",
    displayName: "Pro",
    priceMonthly: 79,
    priceYearly: 790,
    currency: "USD",
    trialDays: 0,
    features: ["Everything in Starter", "Advanced automations", "Team collaboration"],
    limits: {
      maxJobs: 500,
      maxAutomationRuns: 5000,
      maxAiCredits: 1500,
      maxUsers: 5,
      maxStorageMb: 5000,
      maxIntegrations: 15,
      maxReportsPerMonth: 200,
    },
  },
  agency: {
    planKey: "agency",
    displayName: "Agency",
    priceMonthly: 199,
    priceYearly: 1990,
    currency: "USD",
    trialDays: 0,
    features: ["Everything in Pro", "Multi-seat agency workflow", "Higher throughput"],
    limits: {
      maxJobs: 2000,
      maxAutomationRuns: 20000,
      maxAiCredits: 5000,
      maxUsers: 15,
      maxStorageMb: 25000,
      maxIntegrations: 40,
      maxReportsPerMonth: 500,
    },
  },
  enterprise: {
    planKey: "enterprise",
    displayName: "Enterprise",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "USD",
    trialDays: 0,
    features: ["Custom limits", "Dedicated support", "SSO (future)", "Custom contracts"],
    limits: {
      maxJobs: "unlimited",
      maxAutomationRuns: "unlimited",
      maxAiCredits: "unlimited",
      maxUsers: "unlimited",
      maxStorageMb: "unlimited",
      maxIntegrations: "unlimited",
      maxReportsPerMonth: "unlimited",
    },
  },
};

/** Legacy display name -> planKey */
export const displayPlanToPlanKey: Record<(typeof subscriptionPlans)[number], SubscriptionPlanKey> = {
  "Free Trial": "free_trial",
  Starter: "starter",
  Pro: "pro",
  Agency: "agency",
  Enterprise: "enterprise",
};

/** @deprecated Use PLAN_DEFINITIONS[planKey].limits for new code */
export interface PlanLimits {
  maxJobs: number | "unlimited";
  maxAutomationRuns: number | "unlimited";
  maxAiCredits: number | "custom";
  maxUsers: number | "custom";
  maxStorageMb: number | "custom";
}

/** @deprecated Use PLAN_DEFINITIONS */
export const planDefinitions: Record<(typeof subscriptionPlans)[number], PlanLimits> = {
  "Free Trial": { maxJobs: 25, maxAutomationRuns: 100, maxAiCredits: 50, maxUsers: 1, maxStorageMb: 100 },
  Starter: { maxJobs: 100, maxAutomationRuns: 1000, maxAiCredits: 300, maxUsers: 2, maxStorageMb: 1000 },
  Pro: { maxJobs: 500, maxAutomationRuns: 5000, maxAiCredits: 1500, maxUsers: 5, maxStorageMb: 5000 },
  Agency: { maxJobs: 2000, maxAutomationRuns: 20000, maxAiCredits: 5000, maxUsers: 15, maxStorageMb: 25000 },
  Enterprise: { maxJobs: "unlimited", maxAutomationRuns: "unlimited", maxAiCredits: "custom", maxUsers: "custom", maxStorageMb: "custom" },
};
