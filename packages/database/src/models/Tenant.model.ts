import { model, models, Schema } from "mongoose";

const TenantSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true },
    /** Legacy display plan; kept in sync with billing.planKey where possible */
    plan: { type: String, required: true, default: "Free" },
    status: { type: String, enum: ["Active", "Trialing", "Past Due", "Suspended", "Cancelled"], required: true },
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
      planKey: { type: String, default: "free" },
      billingStatus: {
        type: String,
        enum: ["Trialing", "Active", "Past Due", "Cancelled", "Suspended", "Incomplete", "Unpaid"],
        default: "Trialing",
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      stripePriceId: String,
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
      cancelAtPeriodEnd: { type: Boolean, default: false },
      featureFlags: { type: Schema.Types.Mixed },
    },
    limits: {
      maxJobs: { type: Schema.Types.Mixed, default: 25 },
      maxAiCredits: { type: Schema.Types.Mixed, default: 2 },
      maxCvVersions: { type: Schema.Types.Mixed, default: 1 },
      maxDocuments: { type: Schema.Types.Mixed, default: 5 },
      maxQuickReviews: { type: Schema.Types.Mixed, default: 10 },
      maxResearchDocs: { type: Schema.Types.Mixed, default: 0 },
      maxPdfExports: { type: Schema.Types.Mixed, default: 0 },
      maxAutomationRuns: { type: Schema.Types.Mixed, default: 50 },
      maxUsers: { type: Schema.Types.Mixed, default: 1 },
      maxStorageMb: { type: Schema.Types.Mixed, default: 100 },
      maxIntegrations: { type: Schema.Types.Mixed, default: 1 },
      maxReportsPerMonth: { type: Schema.Types.Mixed, default: 0 },
    },
    usage: {
      jobsCount: { type: Number, default: 0 },
      automationRunsThisMonth: { type: Number, default: 0 },
      aiCreditsUsedThisMonth: { type: Number, default: 0 },
      purchasedAiCreditsBalance: { type: Number, default: 0 },
      cvVersionsCount: { type: Number, default: 0 },
      documentsCount: { type: Number, default: 0 },
      quickReviewsThisMonth: { type: Number, default: 0 },
      researchDocsThisMonth: { type: Number, default: 0 },
      pdfExportsThisMonth: { type: Number, default: 0 },
      storageUsedMb: { type: Number, default: 0 },
      usersCount: { type: Number, default: 0 },
      integrationsCount: { type: Number, default: 0 },
      reportsGeneratedThisMonth: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// slug unique index is created by `unique: true` on the field definition
// ownerId and status indexes are applied via applyBaseIndexes or field options

export const TenantModel = models.Tenant || model("Tenant", TenantSchema);
