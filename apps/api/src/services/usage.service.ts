import {
  DocumentModel,
  IntegrationConnectionModel,
  JobModel,
  ReportModel,
  TenantModel,
  UserModel,
} from "@jobflow/database/models";
import { assertTenantId } from "./baseTenant.service";

export type UsageMetric =
  | "jobsCount"
  | "automationRunsThisMonth"
  | "aiCreditsUsedThisMonth"
  | "usersCount"
  | "storageUsedMb"
  | "integrationsCount"
  | "reportsGeneratedThisMonth"
  | "documentsCount";

function tenantQuery(tenantId: string) {
  return { $or: [{ _id: tenantId }, { slug: tenantId }] };
}

function startOfUtcMonth(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

export async function recalculateTenantUsage(input: { tenantId: string }) {
  const tenantId = assertTenantId(input.tenantId);
  const monthStart = startOfUtcMonth();

  const [jobsCount, usersCount, integrationsCount, reportsGeneratedThisMonth, documentsCount, storageAgg] = await Promise.all([
    JobModel.countDocuments({ tenantId }),
    UserModel.countDocuments({ tenantId, status: { $ne: "Removed" } }),
    IntegrationConnectionModel.countDocuments({ tenantId }),
    ReportModel.countDocuments({ tenantId, generatedAt: { $gte: monthStart } }),
    DocumentModel.countDocuments({ tenantId }),
    DocumentModel.aggregate<{ total: number }>([
      { $match: { tenantId } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$metadata.storageMb", 0] } } } },
    ]),
  ]);

  const storageUsedMb = Math.round(storageAgg[0]?.total ?? 0);

  await TenantModel.updateOne(tenantQuery(tenantId), {
    $set: {
      "usage.jobsCount": jobsCount,
      "usage.usersCount": usersCount,
      "usage.integrationsCount": integrationsCount,
      "usage.reportsGeneratedThisMonth": reportsGeneratedThisMonth,
      "usage.documentsCount": documentsCount,
      "usage.storageUsedMb": storageUsedMb,
    },
  });

  return {
    tenantId,
    jobsCount,
    usersCount,
    integrationsCount,
    reportsGeneratedThisMonth,
    documentsCount,
    storageUsedMb,
  };
}

export async function incrementUsage(input: { tenantId: string; metric: UsageMetric; amount: number }) {
  const tenantId = assertTenantId(input.tenantId);
  if (input.amount === 0) return;
  await TenantModel.updateOne(tenantQuery(tenantId), { $inc: { [`usage.${input.metric}`]: input.amount } });
}

export async function decrementUsage(input: { tenantId: string; metric: UsageMetric; amount: number }) {
  const tenantId = assertTenantId(input.tenantId);
  if (input.amount === 0) return;
  await TenantModel.updateOne(tenantQuery(tenantId), { $inc: { [`usage.${input.metric}`]: -input.amount } });
}

export async function resetMonthlyUsage(input: { tenantId: string }) {
  const tenantId = assertTenantId(input.tenantId);
  await TenantModel.updateOne(tenantQuery(tenantId), {
    $set: {
      "usage.automationRunsThisMonth": 0,
      "usage.aiCreditsUsedThisMonth": 0,
      "usage.reportsGeneratedThisMonth": 0,
    },
  });
}
