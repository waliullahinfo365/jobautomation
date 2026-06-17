/**
 * Verifies follow-up reminder delivery (NotificationModel + optional Resend).
 *
 * Usage:
 *   dotenv -e ../../.env -- tsx src/scripts/verify-follow-up-delivery.ts <tenantId> <jobId>
 */
import { connectDatabase } from "@jobflow/database";
import { ApplicationModel, NotificationModel } from "@jobflow/database/models";
import { processFollowUpReminderJob } from "../processors/follow-up-reminder.processor";

const tenantId = process.argv[2];
const jobId = process.argv[3];

if (!tenantId || !jobId) {
  console.error("Usage: tsx verify-follow-up-delivery.ts <tenantId> <jobId>");
  process.exit(1);
}

async function main() {
  await connectDatabase();

  const app = await ApplicationModel.findOne({ tenantId, jobId });
  if (!app) throw new Error("Application not found — run API verify script first");

  await ApplicationModel.findOneAndUpdate(
    { tenantId, jobId },
    {
      applicationStatus: "Applied",
      followUpStatus: "Scheduled",
      followUpDate: new Date(Date.now() - 60_000),
      $unset: { followUpReminderKey: "", followUpReminderSentAt: "" },
    }
  );

  const before = await NotificationModel.countDocuments({ tenantId, moduleKey: "follow-up-reminder" });
  const result = await processFollowUpReminderJob({ tenantId, now: new Date().toISOString() });
  const after = await NotificationModel.countDocuments({ tenantId, moduleKey: "follow-up-reminder" });

  console.log("Sweep result:", result);
  if (after <= before) {
    throw new Error("Expected new NotificationModel row for follow-up-reminder");
  }
  console.log("✓ NotificationModel row created");
  console.log("✓ Check Resend dashboard / owner inbox for email (if RESEND_API_KEY set)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
