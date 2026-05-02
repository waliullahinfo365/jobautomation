import { getDatabaseStatus } from "@database/index";
import { AutomationLogModel, AutomationModuleModel } from "@database/models";
import type { Request } from "express";
import { getCurrentPlan } from "../services/billing.service";
import { getIntegrationHealth } from "../services/integration.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";
import { assertTenantId } from "../services/baseTenant.service";
import { getApiQueueReport } from "../config/queue";
import { env } from "../config/env";
import { isShuttingDown } from "../shutdown";

export const getSystemStatus = asyncHandler(async (req: Request, res) => {
  const tenantId = assertTenantId(req.tenantId);
  const db = getDatabaseStatus();
  const queue = getApiQueueReport();
  const role = req.user?.role ?? "";

  const [billingPlan, integrationHealth, automationModuleCount, failedLogs] = await Promise.all([
    getCurrentPlan({ tenantId }),
    getIntegrationHealth({ tenantId }),
    AutomationModuleModel.countDocuments({ tenantId }),
    AutomationLogModel.find({ tenantId, status: "Failed" }).sort({ createdAt: -1 }).limit(15).lean(),
  ]);

  const recentFailedLogs = failedLogs.map((l) => ({
    id: String(l._id),
    moduleKey: l.moduleKey,
    moduleName: l.moduleName,
    message: l.message,
    error: l.error,
    createdAt: l.createdAt,
  }));

  return successResponse(res, {
    api: {
      status: isShuttingDown() ? "shutting_down" : "ok",
      environment: env.nodeEnv,
    },
    database: {
      state: db.state,
      host: db.host,
      name: db.name,
    },
    queue,
    tenantId,
    currentUserRole: role,
    integrationHealth,
    billing: {
      planKey: billingPlan.planKey,
      displayName: billingPlan.displayName,
      billingStatus: billingPlan.billingStatus,
    },
    automation: {
      moduleCount: automationModuleCount,
    },
    recentFailedLogs,
  });
});
