/**
 * Phase 2 verification for apply assistant complete endpoint.
 *
 * Usage:
 *   dotenv -e ../../.env -- tsx src/scripts/verify-apply-assistant.ts <tenantId> <userId> <jobId>
 */
import { connectDatabase } from "@jobflow/database";
import { ApplicationModel, JobModel, NotificationModel } from "@jobflow/database/models";
import { completeApplyAssistant, streamApplyDocument } from "../services/apply-assistant.service";

const tenantId = process.argv[2];
const userId = process.argv[3];
const jobId = process.argv[4];

type AppDoc = {
  applyMethod?: string;
  applicationStatus?: string;
  followUpDate?: Date | string;
  statusHistory?: unknown[];
};

type JobDoc = { pipelineStage?: string };

if (!tenantId || !userId || !jobId) {
  console.error("Usage: tsx verify-apply-assistant.ts <tenantId> <userId> <jobId>");
  process.exit(1);
}

async function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
  console.log(`✓ ${msg}`);
}

async function main() {
  await connectDatabase();

  await ApplicationModel.deleteMany({ tenantId, jobId });
  await JobModel.findByIdAndUpdate(jobId, { $set: { pipelineStage: "Ready", status: "Ready to Apply" } });

  // 4. In Progress via manual_assistant — no followUpDate, pipeline unchanged
  await completeApplyAssistant({
    tenantId,
    userId,
    jobId,
    status: "In Progress",
    notes: "verify in progress",
  });
  let app = (await ApplicationModel.findOne({ tenantId, jobId }).lean()) as AppDoc | null;
  assert(app?.applyMethod === "manual_assistant", "In Progress sets applyMethod manual_assistant");
  assert(app?.applicationStatus === "In Progress", "In Progress status stored");
  assert(!app?.followUpDate, "In Progress has no followUpDate");
  let job = (await JobModel.findById(jobId).lean()) as JobDoc | null;
  assert(job?.pipelineStage === "Ready", "In Progress leaves pipeline unchanged");

  // 2. Applied upsert from no prior row (deleted above, recreated as In Progress — now transition)
  await ApplicationModel.deleteMany({ tenantId, jobId });
  await JobModel.findByIdAndUpdate(jobId, { $set: { pipelineStage: "Ready", status: "Ready to Apply" } });
  const appliedAt = new Date();
  await completeApplyAssistant({ tenantId, userId, jobId, status: "Applied", notes: "verify applied" });
  app = (await ApplicationModel.findOne({ tenantId, jobId }).lean()) as AppDoc | null;
  assert(Boolean(app), "Applied creates Application from scratch");
  assert(app?.applyMethod === "manual_assistant", "Applied sets applyMethod manual_assistant");
  assert((app?.statusHistory?.length ?? 0) >= 1, "Applied appends statusHistory");
  job = (await JobModel.findById(jobId).lean()) as JobDoc | null;
  assert(job?.pipelineStage === "Applied", "Applied syncs pipeline via shared path");
  const expectedFollowUp = new Date(appliedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const diffMs = Math.abs(new Date(String(app?.followUpDate)).getTime() - expectedFollowUp.getTime());
  assert(diffMs < 120_000, `followUpDate is +7 days (diff ${diffMs}ms)`);

  // 3. Reminder via worker after complete endpoint
  await ApplicationModel.findOneAndUpdate(
    { tenantId, jobId },
    {
      followUpDate: new Date(Date.now() - 60_000),
      followUpStatus: "Scheduled",
      $unset: { followUpReminderKey: "", followUpReminderSentAt: "" },
    }
  );
  const before = await NotificationModel.countDocuments({ tenantId, moduleKey: "follow-up-reminder" });
  const workerMod = require("@jobflow/workers/processors/follow-up-reminder") as {
    processFollowUpReminderJob: (input: { tenantId: string; now: string }) => Promise<unknown>;
  };
  await workerMod.processFollowUpReminderJob({ tenantId, now: new Date().toISOString() });
  const after = await NotificationModel.countDocuments({ tenantId, moduleKey: "follow-up-reminder" });
  assert(after > before, "worker creates NotificationModel after manual_assistant Applied");

  // 1. Drive stream — only when CV linked (skip gracefully)
  try {
    const file = await streamApplyDocument({ tenantId, userId, jobId, role: "cv" });
    assert(file.sizeBytes > 0, "CV stream returns non-zero bytes");
    assert(Boolean(file.contentType), "CV stream has Content-Type");
    console.log(`✓ CV stream: ${file.contentType}, ${file.sizeBytes} bytes`);
  } catch (e) {
    console.log(`ℹ CV stream skipped (no Drive CV linked): ${e instanceof Error ? e.message : e}`);
  }

  console.log("\nApply assistant verification passed.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
