import { ApplicationModel, AuditLogModel, AutomationLogModel, AutomationModuleModel, ContactModel, DocumentModel, IntegrationConnectionModel, InterviewModel, JobModel, ReportModel, TenantModel, UserModel } from "../models";
export async function createIndexes() {
  await Promise.all([TenantModel.syncIndexes(), UserModel.syncIndexes(), IntegrationConnectionModel.syncIndexes(), JobModel.syncIndexes(), ApplicationModel.syncIndexes(), ContactModel.syncIndexes(), InterviewModel.syncIndexes(), DocumentModel.syncIndexes(), AutomationModuleModel.syncIndexes(), AutomationLogModel.syncIndexes(), ReportModel.syncIndexes(), AuditLogModel.syncIndexes()]);
}
