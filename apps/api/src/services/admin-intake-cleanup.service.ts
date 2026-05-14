import { JobModel, TenantModel } from "@jobflow/database/models";
import { classifyEmailType } from "@jobflow/integrations/ai/ai.service";
import type { JobIntakeEmailPayload } from "@jobflow/shared/types/job";

export async function cleanupNonJobIntakeRecords(input: { tenantId: string; dryRun: boolean }) {
  // Find all jobs created from Gmail intake that lack a classification
  const intakeJobs = await JobModel.find({
    tenantId: input.tenantId,
    intakeSource: "gmail",
    extractedFromEmail: true,
  }).select("_id company position status intakeSource providerMessageId jobIntakeClassification extractionConfidence raw description");

  const toArchive: string[] = [];
  const toKeep: string[] = [];
  const classifiedNow: Array<{ id: string; emailType: string; confidence: number; reason: string }> = [];

  for (const job of intakeJobs) {
    // Already classified and kept
    const existing = (job as any).jobIntakeClassification;
    if (existing?.isJobOpportunity === true && existing.confidence >= 0.75) {
      toKeep.push(String(job._id));
      continue;
    }
    // Already classified as non-job
    if (existing?.isJobOpportunity === false) {
      toArchive.push(String(job._id));
      continue;
    }

    // Re-classify using raw email data stored in job
    const raw = (job as any).raw as Record<string, unknown> | undefined;
    const subject = String(raw?.subject ?? `${(job as any).position} at ${(job as any).company}`);
    const from = String(raw?.from ?? "unknown@example.com");
    const payload: JobIntakeEmailPayload = {
      provider: "gmail",
      providerMessageId: String((job as any).providerMessageId ?? ""),
      providerThreadId: "",
      from,
      subject,
      bodyText: String((job as any).description ?? ""),
      receivedAt: new Date().toISOString(),
      labels: [],
    };
    const classification = classifyEmailType(payload);
    classifiedNow.push({
      id: String(job._id),
      emailType: classification.emailType,
      confidence: classification.confidence,
      reason: classification.reason,
    });

    if (!classification.isJobOpportunity || classification.confidence < 0.75) {
      toArchive.push(String(job._id));
    } else {
      toKeep.push(String(job._id));
    }
  }

  if (!input.dryRun && toArchive.length > 0) {
    await JobModel.updateMany(
      { _id: { $in: toArchive }, tenantId: input.tenantId },
      {
        $set: {
          status: "Archived",
          "jobIntakeClassification.isJobOpportunity": false,
          "jobIntakeClassification.reason": "Reclassified as non-job during admin cleanup",
        },
      }
    );
  }

  return {
    dryRun: input.dryRun,
    scanned: intakeJobs.length,
    toArchive: toArchive.length,
    toKeep: toKeep.length,
    classifiedNow: classifiedNow.length,
    archivedIds: input.dryRun ? [] : toArchive,
    preview: input.dryRun ? { toArchive, toKeep } : undefined,
  };
}

export async function recalculateTenantJobsCount(tenantId: string) {
  const realCount = await JobModel.countDocuments({ tenantId, status: { $ne: "Archived" } });
  await TenantModel.updateOne({ _id: tenantId }, { $set: { "usage.jobsCount": realCount } });
  return { tenantId, recalculatedJobsCount: realCount };
}
