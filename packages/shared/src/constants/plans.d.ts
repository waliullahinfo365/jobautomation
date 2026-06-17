import type { PlanDefinition, SubscriptionPlanKey } from "../types/billing";
export declare const subscriptionPlans: readonly ["Free Trial", "Starter", "Pro", "Agency", "Enterprise"];
export declare const tenantRoles: readonly ["Owner", "Admin", "Member", "Viewer"];
export declare const PLAN_DEFINITIONS: Record<SubscriptionPlanKey, PlanDefinition>;
/** Legacy display name -> planKey */
export declare const displayPlanToPlanKey: Record<(typeof subscriptionPlans)[number], SubscriptionPlanKey>;
/** @deprecated Use PLAN_DEFINITIONS[planKey].limits for new code */
export interface PlanLimits {
    maxJobs: number | "unlimited";
    maxAutomationRuns: number | "unlimited";
    maxAiCredits: number | "custom";
    maxUsers: number | "custom";
    maxStorageMb: number | "custom";
}
/** @deprecated Use PLAN_DEFINITIONS */
export declare const planDefinitions: Record<(typeof subscriptionPlans)[number], PlanLimits>;
