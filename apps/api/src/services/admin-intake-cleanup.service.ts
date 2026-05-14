import { JobModel, TenantModel } from "@jobflow/database/models";
import { isRealJobOpportunity } from "@jobflow/integrations/ai/ai.service";
import type { JobIntakeEmailPayload } from "@jobflow/shared/types/job";

const NON_JOB_COMPANY_NAMES = new Set(["linkedin", "unknown company", "unknown", "noreply"]);

const NON_JOB_BODY_MARKERS = [
  /read on linkedin/i,
  /shared an? (article|post|update)/i,
  /linkedin\.com\/pulse\//i,
  /linkedin\.com\/sales\/contract-chooser/i,
  /sales navigator/i,
  /unsubscribe from this (email|newsletter|digest)/i,
];

const NON_JOB_POSITION_PATTERNS = [
  /\b(why|how|what|are|is|the|an|a)\b.{20,}/i, // Looks like article title
  /\d+ (people|connections?)\s*(viewed|have updates)/i,
  /newsletter/i,
];

function isNonJobByContent(job: {
  company: string;
  position: string;
  description?: string;
  jobUrl?: string;
  tags?: string[];
}): { isNonJob: boolean; reason: string } {
  const company = (job.company ?? "").toLowerCase().trim();
  const position = (job.position ?? "").trim();
  const description = (job.description ?? "").toLowerCase();
  const jobUrl = (job.jobUrl ?? "").toLowerCase();

  // Already tagged as rejected
  if (job.tags?.includes("auto-rejected-non-job-email")) {
    return { isNonJob: true, reason: "Already tagged as non-job email" };
  }

  // Company is a known non-job sender name
  if (NON_JOB_COMPANY_NAMES.has(company)) {
    return { isNonJob: true, reason: `Company name "${company}" indicates non-job source` };
  }

  // URL points to LinkedIn Pulse (article) or Sales Navigator
  if (jobUrl.includes("/pulse/") || jobUrl.includes("/sales/contract-chooser")) {
    return { isNonJob: true, reason: `Job URL points to non-job LinkedIn page: ${job.jobUrl}` };
  }

  // Body contains hard non-job markers
  for (const pattern of NON_JOB_BODY_MARKERS) {
    if (pattern.test(description)) {
      return { isNonJob: true, reason: `Description contains non-job pattern: ${pattern.source}` };
    }
  }

  // Position looks like an article title
  for (const pattern of NON_JOB_POSITION_PATTERNS) {
    if (pattern.test(position)) {
      return { isNonJob: true, reason: `Position looks like article title: "${position.slice(0, 80)}"` };
    }
  }

  return { isNonJob: false, reason: "" };
}

export async function cleanupNonJobIntakeRecords(input: { tenantId: string; dryRun: boolean }) {
  // Only look at Gmail-sourced jobs not already archived/rejected
  const intakeJobs = await JobModel.find({
    tenantId: input.tenantId,
    intakeSource: "gmail",
    extractedFromEmail: true,
    status: { $nin: ["Archived", "Rejected"] },
  }).select("_id company position status intakeSource providerMessageId jobIntakeClassification extractionConfidence raw description jobUrl tags");

  const toReject: Array<{ id: string; reason: string }> = [];
  const toKeep: string[] = [];

  for (const job of intakeJobs) {
    // 1. Check existing classification stored on record
    const existing = (job as any).jobIntakeClassification;
    if (existing?.isJobOpportunity === false) {
      toReject.push({ id: String(job._id), reason: existing.reason ?? "Classified as non-job during intake" });
      continue;
    }

    // 2. Check by content heuristics (catches records created before classifier existed)
    const contentCheck = isNonJobByContent({
      company: (job as any).company,
      position: (job as any).position,
      description: (job as any).description,
      jobUrl: (job as any).jobUrl,
      tags: (job as any).tags,
    });
    if (contentCheck.isNonJob) {
      toReject.push({ id: String(job._id), reason: contentCheck.reason });
      continue;
    }

    // 3. Re-run classifier using raw email data stored on job
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
    const classification = isRealJobOpportunity(payload);
    if (!classification.isJob || classification.confidence < 0.85) {
      toReject.push({ id: String(job._id), reason: classification.reason });
    } else {
      toKeep.push(String(job._id));
    }
  }

  if (!input.dryRun && toReject.length > 0) {
    for (const { id, reason } of toReject) {
      await JobModel.updateOne(
        { _id: id, tenantId: input.tenantId },
        {
          $set: {
            status: "Rejected",
            "jobIntakeClassification.isJobOpportunity": false,
            "jobIntakeClassification.reason": reason,
            "rawSourceData.rejectReason": "Non-job Gmail email imported before stricter filter",
            "rawSourceData.rejectDetail": reason,
            "rawSourceData.rejectedAt": new Date().toISOString(),
          },
          $addToSet: { tags: "auto-rejected-non-job-email" },
        }
      );
    }
  }

  return {
    dryRun: input.dryRun,
    scanned: intakeJobs.length,
    toReject: toReject.length,
    toKeep: toKeep.length,
    rejectedIds: input.dryRun ? [] : toReject.map((r) => r.id),
    preview: input.dryRun
      ? toReject.map((r) => ({ id: r.id, reason: r.reason }))
      : undefined,
  };
}

export async function recalculateTenantJobsCount(tenantId: string) {
  const realCount = await JobModel.countDocuments({
    tenantId,
    status: { $nin: ["Rejected", "Archived"] },
  });
  await TenantModel.updateOne({ _id: tenantId }, { $set: { "usage.jobsCount": realCount } });
  return { tenantId, recalculatedJobsCount: realCount };
}
