import { connectDatabase } from "../client";
import { seedAutomationModules } from "./seedAutomationModules";
import { seedDemoData } from "./seedDemoData";
import { seedTenant } from "./seedTenant";

export async function runDemoSeed() {
  // TODO: invoke manually from a one-off script. Do not auto-run in service startup.
  await connectDatabase();
  const tenant = await seedTenant();
  await seedAutomationModules(String(tenant._id));
  await seedDemoData(String(tenant._id));
}

/** Re-run automation modules + demo fixtures for an existing tenant (idempotent). */
export async function runDemoDataForTenant(tenantId: string, createdBy = "system") {
  await seedAutomationModules(tenantId, createdBy);
  await seedDemoData(tenantId, createdBy);
}
