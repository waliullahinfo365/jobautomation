export type SubscriptionPlanKey =
  | "free"
  | "plus"
  | "pro"
  | "executive"
  | "founding_pro"
  /** @deprecated use `free` */
  | "free_trial"
  /** @deprecated use `plus` */
  | "starter"
  /** @deprecated use `executive` */
  | "agency"
  /** @deprecated use `executive` */
  | "enterprise";

export type BillingStatus =
  | "Trialing"
  | "Active"
  | "Past Due"
  | "Cancelled"
  | "Suspended"
  | "Incomplete"
  | "Unpaid";

/** Numeric limit or unlimited */
export type LimitValue = number | "unlimited";

export type ApplyAssistantAccess = "none" | "preview" | "full";

export interface PlanFeatureFlags {
  applyAssistant: ApplyAssistantAccess;
  replyDetection: boolean;
  exportEnabled: boolean;
  jobcenterReport: boolean;
  advancedInsights: boolean;
  prioritySupport: boolean;
  quickReviewUnlimited: boolean;
  telegramNotifications: boolean;
  interviewPrep: boolean;
  companyResearch: boolean;
}

export interface PlanLimits {
  maxJobs: LimitValue;
  maxAiCredits: LimitValue;
  maxCvVersions: LimitValue;
  maxDocuments: LimitValue;
  maxQuickReviews: LimitValue;
  maxResearchDocs: LimitValue;
  maxPdfExports: LimitValue;
  maxIntegrations: LimitValue;
  maxAutomationRuns: LimitValue;
  maxUsers: LimitValue;
  maxStorageMb: LimitValue;
  maxReportsPerMonth: LimitValue;
}

export interface PlanDefinition {
  planKey: SubscriptionPlanKey;
  displayName: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  trialDays: number;
  badge?: "most_popular";
  tagline: string;
  features: string[];
  limits: PlanLimits;
  featureFlags: PlanFeatureFlags;
}

export interface BillingSubscription {
  planKey: SubscriptionPlanKey;
  billingStatus: BillingStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

/** Legacy flat billing shape (API responses may still expose this) */
export interface Billing {
  tenantId: string;
  plan: string;
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
  purchasedAiCreditsBalance: number;
  cvVersionsCount: number;
  documentsCount: number;
  quickReviewsThisMonth: number;
  researchDocsThisMonth: number;
  pdfExportsThisMonth: number;
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
  | "maxReportsPerMonth"
  | "maxCvVersions"
  | "maxDocuments"
  | "maxQuickReviews"
  | "maxResearchDocs"
  | "maxPdfExports";

export interface PlanLimitCheckResult {
  allowed: boolean;
  reason?: string;
  limitName: PlanLimitName;
  currentUsage: number;
  limit: number;
  planKey: SubscriptionPlanKey;
}

export interface TenantFeatureAccess {
  applyAssistant: boolean;
  replyDetection: boolean;
  exports: boolean;
  jobcenterReport: boolean;
  advancedInsights: boolean;
  prioritySupport: boolean;
}

export interface TenantBillingSnapshot {
  planKey: SubscriptionPlanKey;
  displayName: string;
  billingStatus: BillingStatus;
  plan: PlanDefinition;
  limits: PlanLimits;
  usage: PlanUsage;
  features: TenantFeatureAccess;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  purchasedAiCreditsBalance?: number;
}
