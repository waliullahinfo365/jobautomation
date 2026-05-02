import type { subscriptionPlans } from "../constants/plans";
import type { tenantStatuses } from "../constants/statuses";

export type SubscriptionPlan = (typeof subscriptionPlans)[number];
export type TenantStatus = (typeof tenantStatuses)[number];

/**
 * Workspace (tenant) record. Access control is enforced per-user via `User.role` and `ROLE_PERMISSIONS` in the API.
 * Do not trust a `tenantId` from request bodies for authorization—resolve it from the authenticated context.
 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: SubscriptionPlan;
  status: TenantStatus;
  billingStatus: "Trialing" | "Active" | "Past Due" | "Cancelled";
  trialEndsAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  settings: Record<string, unknown>;
  limits: {
    maxJobs: number | "unlimited";
    maxAutomationRuns: number | "unlimited";
    maxAiCredits: number | "custom";
    maxUsers: number | "custom";
    maxStorageMb: number | "custom";
  };
  usage: {
    jobsCount: number;
    automationRunsThisMonth: number;
    aiCreditsUsedThisMonth: number;
    documentsCount: number;
    storageUsedMb: number;
  };
  createdAt: string;
  updatedAt: string;
}
