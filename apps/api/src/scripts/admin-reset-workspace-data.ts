import { connectDatabase, disconnectDatabase } from "@jobflow/database";
import { TenantModel } from "@jobflow/database/models";
import { resetOperationalWorkspaceData } from "../services/admin-reset.service";

async function resolveTenantId() {
  const explicit = process.env.ADMIN_RESET_TENANT_ID || process.env.TENANT_ID;
  if (explicit) return explicit;
  const tenants = await TenantModel.find({}).select("_id name").lean();
  if (tenants.length === 1) return String(tenants[0]._id);
  throw new Error("Set ADMIN_RESET_TENANT_ID when more than one tenant exists.");
}

async function main() {
  if (!process.env.ADMIN_RESET_TOKEN?.trim()) {
    throw new Error("ADMIN_RESET_TOKEN must be set before running this script.");
  }
  const dryRun = process.env.ADMIN_RESET_CONFIRM !== "true";
  await connectDatabase();
  const tenantId = await resolveTenantId();
  const result = await resetOperationalWorkspaceData({
    tenantId,
    userId: "admin-script",
    dryRun,
    reason: dryRun ? "admin reset dry run" : "admin reset confirmed",
  });
  console.log(JSON.stringify(result, null, 2));
  if (dryRun) {
    console.log("Dry run complete. Set ADMIN_RESET_CONFIRM=true to delete operational data.");
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
