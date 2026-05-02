// TODO: Detect duplicate job entries before insertion.

import { DUPLICATE_SIMILARITY_THRESHOLD } from "@/lib/constants";

export interface DuplicateCheckResult {
  isDuplicate:     boolean;
  existingJobId?:  string;
  similarityScore: number;
}

export class DuplicateProtectionService {
  /**
   * TODO: Check if a job (by URL) already exists.
   */
  async checkByUrl(_url: string): Promise<DuplicateCheckResult> {
    // TODO: JobModel.findOne({ url: normalizeUrl(_url) })
    throw new Error("DuplicateProtectionService.checkByUrl not implemented");
  }

  /**
   * TODO: Check for near-duplicate jobs using title + company similarity.
   * Uses threshold from constants: DUPLICATE_SIMILARITY_THRESHOLD.
   */
  async checkBySimilarity(
    _title: string,
    _company: string
  ): Promise<DuplicateCheckResult> {
    // TODO: Levenshtein distance or AI embedding cosine similarity
    console.log(`Threshold: ${DUPLICATE_SIMILARITY_THRESHOLD}`);
    throw new Error("DuplicateProtectionService.checkBySimilarity not implemented");
  }

  /**
   * TODO: Run both checks and return the strongest match.
   */
  async check(_url: string, _title: string, _company: string): Promise<DuplicateCheckResult> {
    throw new Error("DuplicateProtectionService.check not implemented");
  }
}
