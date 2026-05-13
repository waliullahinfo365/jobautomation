import { connectDatabase, disconnectDatabase, getDatabaseStatus } from "@jobflow/database";
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

  const confirmed = process.env.CONFIRM_PRODUCTION_RESET === "true";
  await connectDatabase();
  const db = getDatabaseStatus();
  const tenantId = await resolveTenantId();

  console.log(`Connected database: ${db.name || "(unknown)"} @ ${db.host || "(unknown host)"}`);
  console.log(`Tenant: ${tenantId}`);
  console.log(`Mode: ${confirmed ? "CONFIRMED DELETE" : "DRY RUN"}`);

  const result = await resetOperationalWorkspaceData({
    tenantId,
    userId: "production-admin-script",
    dryRun: !confirmed,
    reason: confirmed ? "production operational reset confirmed" : "production operational reset dry run",
  });

  console.log(JSON.stringify(result, null, 2));
  if (!confirmed) {
    console.log("Dry run complete. Set CONFIRM_PRODUCTION_RESET=true to delete operational data.");
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
