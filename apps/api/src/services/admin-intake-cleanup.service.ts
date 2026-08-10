import { JobModel, TenantModel } from "@jobflow/database/models";
import { isRealJobOpportunity, validateExtractedJobFields } from "@jobflow/integrations/ai/ai.service";
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

  // Position/company heuristics for bad imports
  const fieldValidation = validateExtractedJobFields(job.company ?? "", job.position ?? "");
  if (!fieldValidation.valid) {
    return { isNonJob: true, reason: fieldValidation.reason };
  }

  return { isNonJob: false, reason: "" };
}

export async function cleanupNonJobIntakeRecords(input: { tenantId: string; dryRun: boolean }) {
  // Gmail (legacy) and Unipile intake jobs not already archived/rejected
  const intakeJobs = await JobModel.find({
    tenantId: input.tenantId,
    intakeSource: { $in: ["gmail", "unipile"] },
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
      provider: String((job as any).intakeSource ?? "gmail") === "unipile" ? "unipile" : "gmail",
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
    $nor: [
      {
        $or: [
          { source: "test" },
          { intakeSource: "test" },
          { providerMessageId: { $regex: "^test-" } },
          { "rawSourceData.extractionAi.usedStub": true },
          { "rawSourceData.extractionRaw.from": { $regex: "jobs\\.demo\\.jobflow\\.ai", $options: "i" } },
        ],
      },
    ],
  });
  await TenantModel.updateOne({ _id: tenantId }, { $set: { "usage.jobsCount": realCount } });
  return { tenantId, recalculatedJobsCount: realCount };
}

const TEST_JOB_FILTER = {
  $or: [
    { source: "test" },
    { intakeSource: "test" },
    { providerMessageId: { $regex: "^test-" } },
    { "rawSourceData.extractionAi.usedStub": true },
    { "rawSourceData.extractionRaw.from": { $regex: "jobs\\.demo\\.jobflow\\.ai", $options: "i" } },
  ],
};

export async function cleanupTestJobs(input: { tenantId: string; dryRun: boolean }) {
  const testJobs = await JobModel.find({
    tenantId: input.tenantId,
    status: { $nin: ["Archived", "Rejected"] },
    ...TEST_JOB_FILTER,
  }).select("_id company position source intakeSource providerMessageId status");

  const toArchive = testJobs.map((j) => String(j._id));

  if (!input.dryRun && toArchive.length > 0) {
    await JobModel.updateMany(
      { _id: { $in: toArchive }, tenantId: input.tenantId },
      {
        $set: {
          status: "Archived",
          "rawSourceData.rejectReason": "Demo/test job hidden from production",
          "rawSourceData.archivedAt": new Date().toISOString(),
        },
        $addToSet: { tags: "auto-archived-test-job" },
      }
    );
    // Recalculate count immediately after archiving
    await recalculateTenantJobsCount(input.tenantId);
  }

  return {
    dryRun: input.dryRun,
    scanned: testJobs.length,
    toArchive: toArchive.length,
    archivedIds: input.dryRun ? [] : toArchive,
    preview: input.dryRun
      ? testJobs.map((j) => ({
          id: String(j._id),
          company: (j as any).company,
          position: (j as any).position,
          source: (j as any).source,
          intakeSource: (j as any).intakeSource,
        }))
      : undefined,
  };
}
