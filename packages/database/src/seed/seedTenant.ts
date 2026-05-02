import { TenantModel } from "../models/Tenant.model";
import { UserModel } from "../models/User.model";

const DEMO_SLUG = "demo-jobflow-ai-workspace";
const DEMO_NAME = "Demo JobFlow AI Workspace";
const LEGACY_SLUG = "demo-workspace";

const freeTrialLimits = {
  maxJobs: 25,
  maxAutomationRuns: 100,
  maxAiCredits: 50,
  maxUsers: 1,
  maxStorageMb: 100,
  maxIntegrations: 2,
  maxReportsPerMonth: 10,
};

export async function seedTenant() {
  let tenant = await TenantModel.findOne({ $or: [{ slug: DEMO_SLUG }, { slug: LEGACY_SLUG }] });
  if (tenant) {
    if (tenant.slug !== DEMO_SLUG || tenant.name !== DEMO_NAME) {
      tenant.name = DEMO_NAME;
      tenant.slug = DEMO_SLUG;
      await tenant.save();
    }
  } else {
    tenant = await TenantModel.create({
      name: DEMO_NAME,
      slug: DEMO_SLUG,
      ownerId: "demo-owner",
      plan: "Free Trial",
      status: "Trialing",
      billingStatus: "Trialing",
      billing: {
        planKey: "free_trial",
        billingStatus: "Trialing",
        cancelAtPeriodEnd: false,
      },
      limits: freeTrialLimits,
      usage: {
        jobsCount: 0,
        automationRunsThisMonth: 0,
        aiCreditsUsedThisMonth: 0,
        documentsCount: 0,
        storageUsedMb: 0,
        usersCount: 0,
        integrationsCount: 0,
        reportsGeneratedThisMonth: 0,
      },
    });
  }

  const userFilter = { tenantId: String(tenant._id), email: "owner@demo.local" };
  const existingUser = await UserModel.findOne(userFilter);
  if (!existingUser) {
    await UserModel.create({
      ...userFilter,
      createdBy: "system",
      name: "Demo Owner",
      passwordHash: "TODO_HASH",
      role: "Owner",
      status: "Active",
    });
  }

  return tenant;
}
