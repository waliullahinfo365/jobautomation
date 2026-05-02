import {
  ApplicationModel,
  AutomationLogModel,
  ContactModel,
  DocumentModel,
  InterviewModel,
  JobModel,
  ReportModel,
} from "@database/models";
import { runDemoDataForTenant } from "@jobflow/database";
import type { Request } from "express";
import { env } from "../config/env";
import { asyncHandler } from "../utils/asyncHandler";
import { errorResponse, successResponse } from "../utils/apiResponse";
import { assertTenantId } from "../services/baseTenant.service";

function demoResetAllowed(): boolean {
  return env.nodeEnv !== "production" || env.demoModeEnabled;
}

function isOwnerOrAdmin(role: string | undefined): boolean {
  return role === "Owner" || role === "Admin";
}

export const postDemoReset = asyncHandler(async (req: Request, res) => {
  if (!demoResetAllowed()) {
    return errorResponse(res, "Demo reset is not available in this environment", "DEMO_DISABLED", 404);
  }
  if (!isOwnerOrAdmin(req.user?.role)) {
    return errorResponse(res, "Only workspace owners and admins can reset demo data", "FORBIDDEN", 403);
  }
  const tenantId = assertTenantId(req.tenantId);
  const userId = req.user?.id ?? "system";
  await runDemoDataForTenant(tenantId, userId);

  const [jobs, applications, contacts, interviews, documents, reports, automationLogs] = await Promise.all([
    JobModel.countDocuments({ tenantId }),
    ApplicationModel.countDocuments({ tenantId }),
    ContactModel.countDocuments({ tenantId }),
    InterviewModel.countDocuments({ tenantId }),
    DocumentModel.countDocuments({ tenantId }),
    ReportModel.countDocuments({ tenantId }),
    AutomationLogModel.countDocuments({ tenantId }),
  ]);

  return successResponse(
    res,
    {
      tenantId,
      jobs,
      applications,
      contacts,
      interviews,
      documents,
      reports,
      automationLogs,
    },
    "Demo data refreshed"
  );
});
