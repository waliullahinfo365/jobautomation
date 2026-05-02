import type { PlanLimitName } from "@shared/types/billing";
import { createAutomationLog } from "./automation-log.service";
import { checkPlanLimit } from "./billing.service";
import { ApiError } from "../utils/errors";

const LIMIT_MESSAGE = "Plan limit reached. Upgrade your plan to continue.";

async function assertLimit(tenantId: string, limitName: PlanLimitName, incrementBy: number) {
  const result = await checkPlanLimit({ tenantId, limitName, incrementBy });
  if (result.allowed) return result;
  await createAutomationLog({
    tenantId,
    moduleKey: "billing",
    moduleName: "Billing",
    status: "Warning",
    message: "Plan limit blocked action",
    metadata: {
      limitName: result.limitName,
      currentUsage: result.currentUsage,
      limit: result.limit,
      planKey: result.planKey,
    },
  });
  throw new ApiError(LIMIT_MESSAGE, 402, "PLAN_LIMIT", result);
}

export async function assertCanCreateJob(tenantId: string) {
  await assertLimit(tenantId, "maxJobs", 1);
}

export async function assertCanRunAutomation(tenantId: string) {
  await assertLimit(tenantId, "maxAutomationRuns", 1);
}

export async function assertCanUseAiCredits(tenantId: string, estimatedCredits: number) {
  await assertLimit(tenantId, "maxAiCredits", Math.max(0, estimatedCredits));
}

export async function assertCanAddUser(tenantId: string) {
  await assertLimit(tenantId, "maxUsers", 1);
}

export async function assertCanAddIntegration(tenantId: string) {
  await assertLimit(tenantId, "maxIntegrations", 1);
}

export async function assertCanGenerateReport(tenantId: string) {
  await assertLimit(tenantId, "maxReportsPerMonth", 1);
}
