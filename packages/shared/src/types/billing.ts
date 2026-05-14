export type SubscriptionPlanKey = "free_trial" | "starter" | "pro" | "agency" | "enterprise";

export type BillingStatus = "Trialing" | "Active" | "Past Due" | "Cancelled" | "Suspended";

/** Numeric limit or unlimited (enterprise) */
export type LimitValue = number | "unlimited";

export interface PlanDefinition {
  planKey: SubscriptionPlanKey;
  displayName: "Free Trial" | "Starter" | "Pro" | "Agency" | "Enterprise";
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  trialDays: number;
  features: string[];
  limits: {
    maxJobs: LimitValue;
    maxAutomationRuns: LimitValue;
    maxAiCredits: LimitValue;
    maxUsers: LimitValue;
    maxStorageMb: LimitValue;
    maxIntegrations: LimitValue;
    maxReportsPerMonth: LimitValue;
  };
}

export interface BillingSubscription {
  planKey: SubscriptionPlanKey;
  billingStatus: BillingStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

/** Legacy flat billing shape (API responses may still expose this) */
export interface Billing {
  tenantId: string;
  plan: "Free Trial" | "Starter" | "Pro" | "Agency" | "Enterprise";
  status: BillingStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  periodStart?: string;
  periodEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  sessionId: string;
  planKey: SubscriptionPlanKey;
  status: "open" | "stub_pending" | "stub_open";
}

export interface PlanUsage {
  jobsCount: number;
  automationRunsThisMonth: number;
  aiCreditsUsedThisMonth: number;
  usersCount: number;
  storageUsedMb: number;
  integrationsCount: number;
  reportsGeneratedThisMonth: number;
}

export type PlanLimitName =
  | "maxJobs"
  | "maxAutomationRuns"
  | "maxAiCredits"
  | "maxUsers"
  | "maxStorageMb"
  | "maxIntegrations"
  | "maxReportsPerMonth";

export interface PlanLimitCheckResult {
  allowed: boolean;
  reason?: string;
  limitName: PlanLimitName;
  currentUsage: number;
  limit: number;
  planKey: SubscriptionPlanKey;
}

export interface TenantBillingSnapshot {
  planKey: SubscriptionPlanKey;
  displayName: PlanDefinition["displayName"];
  billingStatus: BillingStatus;
  plan: PlanDefinition;
  limits: PlanDefinition["limits"];
  usage: PlanUsage;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}
