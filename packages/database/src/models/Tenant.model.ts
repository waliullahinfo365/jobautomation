import { model, models, Schema } from "mongoose";

const TenantSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true, index: true },
    /** Legacy display plan; kept in sync with billing.planKey where possible */
    plan: { type: String, enum: ["Free Trial", "Starter", "Pro", "Agency", "Enterprise"], required: true },
    status: { type: String, enum: ["Active", "Trialing", "Past Due", "Suspended", "Cancelled"], required: true, index: true },
    /** Legacy top-level billing status; prefer billing.billingStatus when present */
    billingStatus: {
      type: String,
      enum: ["Trialing", "Active", "Past Due", "Cancelled", "Suspended"],
      default: "Trialing",
    },
    trialEndsAt: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    settings: { type: Schema.Types.Mixed, default: {} },
    billing: {
      planKey: {
        type: String,
        enum: ["free_trial", "starter", "pro", "agency", "enterprise"],
        default: "free_trial",
      },
      billingStatus: {
        type: String,
        enum: ["Trialing", "Active", "Past Due", "Cancelled", "Suspended"],
        default: "Trialing",
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
      cancelAtPeriodEnd: { type: Boolean, default: false },
    },
    limits: {
      maxJobs: { type: Schema.Types.Mixed, default: 25 },
      maxAutomationRuns: { type: Schema.Types.Mixed, default: 100 },
      maxAiCredits: { type: Schema.Types.Mixed, default: 50 },
      maxUsers: { type: Schema.Types.Mixed, default: 1 },
      maxStorageMb: { type: Schema.Types.Mixed, default: 100 },
      maxIntegrations: { type: Schema.Types.Mixed, default: 2 },
      maxReportsPerMonth: { type: Schema.Types.Mixed, default: 10 },
    },
    usage: {
      jobsCount: { type: Number, default: 0 },
      automationRunsThisMonth: { type: Number, default: 0 },
      aiCreditsUsedThisMonth: { type: Number, default: 0 },
      documentsCount: { type: Number, default: 0 },
      storageUsedMb: { type: Number, default: 0 },
      usersCount: { type: Number, default: 0 },
      integrationsCount: { type: Number, default: 0 },
      reportsGeneratedThisMonth: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

TenantSchema.index({ slug: 1 }, { unique: true });
TenantSchema.index({ ownerId: 1 });
TenantSchema.index({ status: 1 });

export const TenantModel = models.Tenant || model("Tenant", TenantSchema);
