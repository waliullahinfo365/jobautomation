import type { PlanDefinition, PlanUsage, SubscriptionPlanKey, TenantFeatureAccess } from "../types/billing";
import { getPlanDefinition, normalizePlanKey } from "../constants/plans";

function isPaidAndActive(planKey: SubscriptionPlanKey, billingStatus: string): boolean {
  const normalized = normalizePlanKey(planKey);
  if (normalized === "free") return false;
  return billingStatus === "Active" || billingStatus === "Trialing";
}

function limitReached(usage: number, limit: number | "unlimited" | undefined): boolean {
  if (limit === "unlimited" || limit === undefined) return false;
  return usage >= limit;
}

export function buildFeatureAccess(
  planKey: SubscriptionPlanKey,
  billingStatus: string,
  plan: PlanDefinition
): TenantFeatureAccess {
  const paid = isPaidAndActive(planKey, billingStatus);
  const flags = plan.featureFlags;

  return {
    applyAssistant: paid && flags.applyAssistant === "full",
    replyDetection: paid && flags.replyDetection,
    exports: paid && flags.exportEnabled,
    jobcenterReport: paid && flags.jobcenterReport,
    advancedInsights: paid && flags.advancedInsights,
    prioritySupport: paid && flags.prioritySupport,
  };
}

export function canUseApplyAssistant(
  planKey: SubscriptionPlanKey,
  billingStatus: string,
  plan: PlanDefinition
): boolean {
  if (!isPaidAndActive(planKey, billingStatus)) {
    return plan.featureFlags.applyAssistant === "preview";
  }
  return plan.featureFlags.applyAssistant !== "none";
}

export function canGenerateCoverLetter(usage: PlanUsage, plan: PlanDefinition): boolean {
  const totalCredits = usage.aiCreditsUsedThisMonth;
  const purchased = usage.purchasedAiCreditsBalance ?? 0;
  const limit = plan.limits.maxAiCredits;
  if (limit === "unlimited") return true;
  return totalCredits < limit + purchased;
}

export function canCreateJob(usage: PlanUsage, plan: PlanDefinition): boolean {
  return !limitReached(usage.jobsCount, plan.limits.maxJobs);
}

export function canUploadCvVersion(usage: PlanUsage, plan: PlanDefinition): boolean {
  return !limitReached(usage.cvVersionsCount ?? 0, plan.limits.maxCvVersions);
}

export function canUseReplyDetection(planKey: SubscriptionPlanKey, billingStatus: string, plan: PlanDefinition): boolean {
  return buildFeatureAccess(planKey, billingStatus, plan).replyDetection;
}

export function canExportReport(planKey: SubscriptionPlanKey, billingStatus: string, plan: PlanDefinition): boolean {
  return buildFeatureAccess(planKey, billingStatus, plan).exports;
}

export function canUseJobcenterReport(planKey: SubscriptionPlanKey, billingStatus: string, plan: PlanDefinition): boolean {
  return buildFeatureAccess(planKey, billingStatus, plan).jobcenterReport;
}

export function canUseAdvancedInsights(planKey: SubscriptionPlanKey, billingStatus: string, plan: PlanDefinition): boolean {
  return buildFeatureAccess(planKey, billingStatus, plan).advancedInsights;
}

export type FeatureGateSnapshot = {
  plan: SubscriptionPlanKey;
  subscriptionStatus: string;
  limits: PlanDefinition["limits"];
  usage: PlanUsage;
  features: TenantFeatureAccess;
  gates: {
    applyAssistant: boolean;
    coverLetter: boolean;
    createJob: boolean;
    cvVersion: boolean;
    replyDetection: boolean;
    exportReport: boolean;
    jobcenterReport: boolean;
    advancedInsights: boolean;
  };
};

export function buildFeatureGateSnapshot(input: {
  planKey: SubscriptionPlanKey;
  billingStatus: string;
  plan: PlanDefinition;
  usage: PlanUsage;
}): FeatureGateSnapshot {
  const planKey = normalizePlanKey(input.planKey);
  const plan = input.plan;
  const features = buildFeatureAccess(planKey, input.billingStatus, plan);

  return {
    plan: planKey,
    subscriptionStatus: input.billingStatus,
    limits: plan.limits,
    usage: input.usage,
    features,
    gates: {
      applyAssistant: canUseApplyAssistant(planKey, input.billingStatus, plan),
      coverLetter: canGenerateCoverLetter(input.usage, plan),
      createJob: canCreateJob(input.usage, plan),
      cvVersion: canUploadCvVersion(input.usage, plan),
      replyDetection: canUseReplyDetection(planKey, input.billingStatus, plan),
      exportReport: canExportReport(planKey, input.billingStatus, plan),
      jobcenterReport: canUseJobcenterReport(planKey, input.billingStatus, plan),
      advancedInsights: canUseAdvancedInsights(planKey, input.billingStatus, plan),
    },
  };
}
