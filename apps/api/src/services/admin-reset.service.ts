import {
  AiUsageLogModel,
  ApplicationModel,
  AuditLogModel,
  AutomationLogModel,
  DocumentModel,
  InterviewModel,
  IntegrationConnectionModel,
  JobModel,
  NotificationModel,
  ReportModel,
  TenantModel,
  UserModel,
} from "@jobflow/database/models";
import { getDatabaseStatus } from "@jobflow/database";
import { env } from "../config/env";

type CountMap = Record<string, number>;

export type ResetOperationalDataInput = {
  tenantId: string;
  userId?: string;
  dryRun: boolean;
  reason?: string;
};

const jobLinkedDocumentFilter = (tenantId: string) => ({
  tenantId,
  $or: [
    { jobId: { $exists: true, $nin: [null, ""] } },
    { aiGenerated: true },
    { documentKind: { $in: ["Research", "Cover Letter", "PDF Export"] }, profileDocumentType: { $exists: false } },
    { type: { $in: ["ai_draft", "pdf_export"] } },
  ],
});

export async function getOperationalDataCounts(tenantId: string) {
  const [
    jobs,
    applications,
    interviews,
    generatedDocuments,
    reports,
    automationLogs,
    notifications,
    aiUsageLogs,
    auditLogs,
    tenantsPreserved,
    usersPreserved,
    integrationsPreserved,
    activeProfileDocumentsPreserved,
    allWorkspaceDocumentsPreserved,
  ] = await Promise.all([
    JobModel.countDocuments({ tenantId }),
    ApplicationModel.countDocuments({ tenantId }),
    InterviewModel.countDocuments({ tenantId }),
    DocumentModel.countDocuments(jobLinkedDocumentFilter(tenantId)),
    ReportModel.countDocuments({ tenantId }),
    AutomationLogModel.countDocuments({ tenantId }),
    NotificationModel.countDocuments({ tenantId }),
    AiUsageLogModel.countDocuments({ tenantId }),
    AuditLogModel.countDocuments({ tenantId }),
    TenantModel.countDocuments({ _id: tenantId }),
    UserModel.countDocuments({ tenantId }),
    IntegrationConnectionModel.countDocuments({ tenantId }),
    DocumentModel.countDocuments({ tenantId, isActiveProfileDocument: true }),
    DocumentModel.countDocuments({
      tenantId,
      $or: [{ jobId: { $exists: false } }, { jobId: null }, { jobId: "" }],
      aiGenerated: { $ne: true },
    }),
  ]);

  return {
    delete: {
      jobs,
      applications,
      interviews,
      generatedDocuments,
      reports,
      automationLogs,
      notifications,
      aiUsageLogs,
    },
    preserve: {
      tenants: tenantsPreserved,
      users: usersPreserved,
      integrations: integrationsPreserved,
      activeProfileDocuments: activeProfileDocumentsPreserved,
      workspaceDocuments: allWorkspaceDocumentsPreserved,
      auditLogs,
    },
  };
}

async function deleteOperationalData(tenantId: string): Promise<CountMap> {
  const [
    jobs,
    applications,
    interviews,
    generatedDocuments,
    reports,
    automationLogs,
    notifications,
    aiUsageLogs,
  ] = await Promise.all([
    JobModel.deleteMany({ tenantId }),
    ApplicationModel.deleteMany({ tenantId }),
    InterviewModel.deleteMany({ tenantId }),
    DocumentModel.deleteMany(jobLinkedDocumentFilter(tenantId)),
    ReportModel.deleteMany({ tenantId }),
    AutomationLogModel.deleteMany({ tenantId }),
    NotificationModel.deleteMany({ tenantId }),
    AiUsageLogModel.deleteMany({ tenantId }),
  ]);

  return {
    jobs: jobs.deletedCount ?? 0,
    applications: applications.deletedCount ?? 0,
    interviews: interviews.deletedCount ?? 0,
    generatedDocuments: generatedDocuments.deletedCount ?? 0,
    reports: reports.deletedCount ?? 0,
    automationLogs: automationLogs.deletedCount ?? 0,
    notifications: notifications.deletedCount ?? 0,
    aiUsageLogs: aiUsageLogs.deletedCount ?? 0,
  };
}

export async function resetOperationalWorkspaceData(input: ResetOperationalDataInput) {
  const before = await getOperationalDataCounts(input.tenantId);

  if (input.dryRun) {
    return {
      dryRun: true,
      tenantId: input.tenantId,
      counts: before,
      message: "Dry run only. No operational data was deleted.",
    };
  }

  const deleted = await deleteOperationalData(input.tenantId);
  const after = await getOperationalDataCounts(input.tenantId);

  await AuditLogModel.create({
    tenantId: input.tenantId,
    createdBy: input.userId ?? "system",
    userId: input.userId,
    action: "admin.workspace.reset_operational_data",
    entityType: "Tenant",
    entityId: input.tenantId,
    message: "Operational dashboard data reset for client test.",
    metadata: {
      reason: input.reason,
      before,
      deleted,
      after,
      preserved: after.preserve,
    },
  });

  return {
    dryRun: false,
    tenantId: input.tenantId,
    before,
    deleted,
    after,
    message: "Operational data reset completed. Configuration, integrations, users, and active templates were preserved.",
  };
}

export async function getAdminDebugDataCounts(tenantId: string) {
  const db = getDatabaseStatus();
  const counts = await getOperationalDataCounts(tenantId);
  return {
    tenantId,
    environment: env.nodeEnv,
    database: {
      name: db.name,
      host: db.host,
      state: db.state,
    },
    mockFallbackEnabled: false,
    demoModeEnabled: env.demoModeEnabled,
    counts: {
      jobs: counts.delete.jobs,
      applications: counts.delete.applications,
      documents: counts.delete.generatedDocuments + counts.preserve.workspaceDocuments,
      generatedDocuments: counts.delete.generatedDocuments,
      reports: counts.delete.reports,
      interviews: counts.delete.interviews,
      automationLogs: counts.delete.automationLogs,
      integrations: counts.preserve.integrations,
      users: counts.preserve.users,
      workspaces: counts.preserve.tenants,
      activeProfileDocuments: counts.preserve.activeProfileDocuments,
    },
    resetPreview: counts,
  };
}
