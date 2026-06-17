/**
 * Phase 0 verification for application documentation unification.
 *
 * Usage:
 *   dotenv -e ../../.env -- tsx src/scripts/verify-application-documentation.ts <tenantId> <userId> <jobId>
 */
import { connectDatabase } from "@jobflow/database";
import { ApplicationModel, JobModel } from "@jobflow/database/models";
import { documentApplicationEvent } from "@jobflow/database";
import { markApplicationApplied } from "../services/applied-status.service";

type AppDoc = {
  applyMethod?: string;
  statusHistory?: unknown[];
  applicationStatus?: string;
  followUpDate?: Date | string;
  followUpStatus?: string;
};

type JobDoc = {
  company?: string;
  position?: string;
  pipelineStage?: string;
};

const tenantId = process.argv[2];
const userId = process.argv[3];
const jobId = process.argv[4];

if (!tenantId || !userId || !jobId) {
  console.error("Usage: tsx verify-application-documentation.ts <tenantId> <userId> <jobId>");
  process.exit(1);
}

async function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
  console.log(`✓ ${msg}`);
}

async function main() {
  await connectDatabase();

  const jobBefore = (await JobModel.findOne({ _id: jobId, tenantId }).lean()) as JobDoc | null;
  assert(Boolean(jobBefore), "job exists");

  await ApplicationModel.deleteMany({ tenantId, jobId });

  // 1a. manual_log via documentApplicationEvent
  const logged = await documentApplicationEvent({
    tenantId,
    userId,
    jobId,
    applicationStatus: "Applied",
    applyMethod: "manual_log",
    appliedAt: new Date(),
  });
  let app = (await ApplicationModel.findById(logged._id).lean()) as AppDoc | null;
  assert(app?.applyMethod === "manual_log", "manual_log sets applyMethod");
  assert(Array.isArray(app?.statusHistory) && app.statusHistory.length === 1, "manual_log writes statusHistory");
  let job = (await JobModel.findById(jobId).lean()) as JobDoc | null;
  assert(job?.pipelineStage === "Applied", "manual_log syncs pipelineStage");

  // 1b. mark-applied API path (requires application row — upsert creates one first as Drafted)
  await ApplicationModel.deleteMany({ tenantId, jobId });
  await JobModel.findByIdAndUpdate(jobId, { $set: { pipelineStage: "Ready", status: "Ready to Apply" } });
  const shell = await ApplicationModel.create({
    tenantId,
    createdBy: userId,
    jobId,
    company: String(jobBefore?.company ?? "Test Co"),
    position: String(jobBefore?.position ?? "Test Role"),
    applicationStatus: "Drafted",
    responseStatus: "No Response",
    followUpStatus: "Not Needed",
    statusHistory: [],
  });
  await markApplicationApplied({
    tenantId,
    userId,
    applicationId: String(shell._id),
    appliedAt: new Date(),
  });
  app = (await ApplicationModel.findOne({ tenantId, jobId }).lean()) as AppDoc | null;
  assert(app?.applyMethod === "manual", "mark-applied sets applyMethod manual");
  assert((app?.statusHistory?.length ?? 0) >= 1, "mark-applied appends statusHistory");

  // 1c. linkedin_auto
  await ApplicationModel.deleteMany({ tenantId, jobId });
  await JobModel.findByIdAndUpdate(jobId, { $set: { pipelineStage: "Ready", status: "Ready to Apply" } });
  await documentApplicationEvent({
    tenantId,
    userId,
    jobId,
    applicationStatus: "Applied",
    applyMethod: "linkedin_auto",
    appliedAt: new Date(),
  });
  app = (await ApplicationModel.findOne({ tenantId, jobId }).lean()) as AppDoc | null;
  assert(app?.applyMethod === "linkedin_auto", "linkedin_auto sets applyMethod");
  job = (await JobModel.findById(jobId).lean()) as JobDoc | null;
  assert(job?.pipelineStage === "Applied", "linkedin_auto syncs pipelineStage");

  await ApplicationModel.deleteMany({ tenantId, jobId });
  await JobModel.findByIdAndUpdate(jobId, { $set: { pipelineStage: "Ready", status: "Ready to Apply" } });

  // 2. In Progress — no follow-up, pipeline unchanged
  const inProg = await documentApplicationEvent({
    tenantId,
    userId,
    jobId,
    applicationStatus: "In Progress",
    applyMethod: "manual",
  });
  app = (await ApplicationModel.findById(inProg._id).lean()) as AppDoc | null;
  assert(app?.applicationStatus === "In Progress", "In Progress status stored");
  assert(!app?.followUpDate, "In Progress has no followUpDate");
  job = (await JobModel.findById(jobId).lean()) as JobDoc | null;
  assert(job?.pipelineStage === "Ready", "In Progress leaves pipelineStage unchanged");

  // 3. Applied — +7 days
  const appliedAt = new Date();
  const applied = await documentApplicationEvent({
    tenantId,
    userId,
    jobId,
    applicationId: String(inProg._id),
    applicationStatus: "Applied",
    applyMethod: "manual",
    appliedAt,
  });
  app = (await ApplicationModel.findById(applied._id).lean()) as AppDoc | null;
  const expectedFollowUp = new Date(appliedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const diffMs = Math.abs(new Date(String(app?.followUpDate)).getTime() - expectedFollowUp.getTime());
  assert(diffMs < 60_000, `followUpDate is +7 days (diff ${diffMs}ms)`);
  assert(app?.followUpStatus === "Scheduled", "Applied sets followUpStatus Scheduled");

  // 5. Rejected — Not Needed, excluded from due query
  await documentApplicationEvent({
    tenantId,
    userId,
    jobId,
    applicationId: String(applied._id),
    applicationStatus: "Rejected",
    applyMethod: "manual",
  });
  app = (await ApplicationModel.findOne({ tenantId, jobId }).lean()) as AppDoc | null;
  assert(app?.followUpStatus === "Not Needed", "Rejected sets followUpStatus Not Needed");
  const dueCount = await ApplicationModel.countDocuments({
    tenantId,
    jobId,
    applicationStatus: { $in: ["Applied", "Follow-Up Due"] },
    followUpStatus: { $in: ["Scheduled", "Due Today", "Overdue"] },
    followUpDate: { $lte: new Date() },
  });
  assert(dueCount === 0, "Rejected excluded from due follow-up query");

  // 4. Reminder delivery — set followUpDate in past; run worker sweep separately:
  //    dotenv -e ../../.env -- tsx ../workers/src/scripts/verify-follow-up-delivery.ts <tenantId> <jobId>
  await ApplicationModel.findOneAndUpdate(
    { tenantId, jobId },
    {
      applicationStatus: "Applied",
      followUpStatus: "Scheduled",
      followUpDate: new Date(Date.now() - 60_000),
      $unset: { followUpReminderKey: "", followUpReminderSentAt: "" },
    }
  );
  console.log("ℹ Set followUpDate in past — run workers verify script for NotificationModel + email proof");

  console.log("\nAll Phase 0 assertions passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
