import { JobModel } from "@jobflow/database/models";
import { createJobFingerprint, normalizeText, normalizeUrl } from "@jobflow/shared/utils/fingerprint";
import type { DuplicateCheckResult, JobExtractionResult } from "@jobflow/shared/types/job";

type PotentialDuplicate = {
  _id: string;
  company: string;
  position: string;
  jobUrl?: string;
  fingerprintHash?: string;
};

function tokenOverlap(a: string, b: string): number {
  const aTokens = new Set(normalizeText(a).split(" ").filter(Boolean));
  const bTokens = new Set(normalizeText(b).split(" ").filter(Boolean));
  if (!aTokens.size || !bTokens.size) return 0;
  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }
  return intersection / Math.max(aTokens.size, bTokens.size);
}

function isSimilarPosition(existing: string, incoming: string): boolean {
  const a = normalizeText(existing);
  const b = normalizeText(incoming);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return tokenOverlap(a, b) >= 0.6;
}

export function computeDuplicateScore(existingJob: PotentialDuplicate, extraction: JobExtractionResult): number {
  const existingUrl = normalizeUrl(existingJob.jobUrl);
  const incomingUrl = normalizeUrl(extraction.jobUrl);
  if (existingUrl && incomingUrl && existingUrl === incomingUrl) return 1;

  const companyMatch = normalizeText(existingJob.company) === normalizeText(extraction.company);
  const positionSimilarity = tokenOverlap(existingJob.position, extraction.position);
  const positionMatch = isSimilarPosition(existingJob.position, extraction.position);
  if (companyMatch && positionMatch) return Math.max(0.75, 0.7 + positionSimilarity * 0.3);

  return 0;
}

export async function findPotentialDuplicates(tenantId: string, extraction: JobExtractionResult): Promise<PotentialDuplicate[]> {
  const normalizedCompany = normalizeText(extraction.company);
  const normalizedUrl = normalizeUrl(extraction.jobUrl);
  const jobs = await JobModel.find({ tenantId }).select("_id company position jobUrl fingerprintHash").lean<PotentialDuplicate[]>();

  return jobs.filter((job) => {
    const companyMatches = normalizeText(job.company) === normalizedCompany;
    const urlMatches = normalizedUrl && normalizeUrl(job.jobUrl) === normalizedUrl;
    return companyMatches || Boolean(urlMatches);
  });
}

export async function checkDuplicateJob(
  tenantId: string,
  extraction: JobExtractionResult
): Promise<DuplicateCheckResult> {
  const fingerprintHash = createJobFingerprint({
    tenantId,
    company: extraction.company,
    position: extraction.position,
    jobUrl: extraction.jobUrl,
  });

  const exactFingerprint = await JobModel.findOne({ tenantId, fingerprintHash }).select("_id");
  if (exactFingerprint) {
    return {
      status: "Duplicate",
      duplicateOfJobId: String(exactFingerprint._id),
      duplicateScore: 1,
      reasons: ["Exact fingerprint match"],
    };
  }

  const potential = await findPotentialDuplicates(tenantId, extraction);
  for (const job of potential) {
    if (normalizeUrl(job.jobUrl) && normalizeUrl(job.jobUrl) === normalizeUrl(extraction.jobUrl)) {
      return {
        status: "Duplicate",
        duplicateOfJobId: String(job._id),
        duplicateScore: 1,
        reasons: ["Matching job URL"],
      };
    }
    const score = computeDuplicateScore(job, extraction);
    if (score >= 0.75) {
      return {
        status: "Possible Duplicate",
        duplicateOfJobId: String(job._id),
        duplicateScore: score,
        reasons: ["Company and similar role match"],
      };
    }
  }

  return {
    status: "Unique",
    duplicateScore: 0,
    reasons: ["No duplicate signals found"],
  };
}
