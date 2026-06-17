/**
 * Phase 0 follow-up: In Progress → Applied → Interview must append three statusHistory entries.
 *
 * Usage:
 *   dotenv -e ../../.env -- tsx src/scripts/verify-status-history-transitions.ts <tenantId> <userId> <jobId>
 */
import { connectDatabase } from "@jobflow/database";
import { ApplicationModel, JobModel } from "@jobflow/database/models";
import { documentApplicationEvent } from "@jobflow/database";

const tenantId = process.argv[2];
const userId = process.argv[3];
const jobId = process.argv[4];

if (!tenantId || !userId || !jobId) {
  console.error("Usage: tsx verify-status-history-transitions.ts <tenantId> <userId> <jobId>");
  process.exit(1);
}

async function main() {
  await connectDatabase();

  await ApplicationModel.deleteMany({ tenantId, jobId });
  await JobModel.findByIdAndUpdate(jobId, { $set: { pipelineStage: "Ready", status: "Ready to Apply" } });

  await documentApplicationEvent({
    tenantId,
    userId,
    jobId,
    applicationStatus: "In Progress",
    applyMethod: "manual",
  });
  await documentApplicationEvent({
    tenantId,
    userId,
    jobId,
    applicationStatus: "Applied",
    applyMethod: "manual",
    appliedAt: new Date(),
  });
  await documentApplicationEvent({
    tenantId,
    userId,
    jobId,
    applicationStatus: "Interview",
    applyMethod: "manual",
  });

  const app = await ApplicationModel.findOne({ tenantId, jobId }).lean();
  const history = (app as { statusHistory?: { status: string; at: Date }[] } | null)?.statusHistory ?? [];

  if (history.length !== 3) {
    throw new Error(`Expected 3 statusHistory entries, got ${history.length}`);
  }
  if (history[0]?.status !== "In Progress" || history[1]?.status !== "Applied" || history[2]?.status !== "Interview") {
    throw new Error(`Unexpected statusHistory order: ${history.map((h) => h.status).join(" → ")}`);
  }

  console.log("✓ statusHistory has three ordered entries:", history.map((h) => h.status).join(" → "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
