// TODO: Handle the full job intake flow: parse → deduplicate → save → trigger automation.

import type { CreateJobInput } from "@/types/job";

export class JobIntakeService {
  /**
   * TODO: Parse a raw job URL or pasted text into a structured Job object using AI.
   */
  async parseJobFromUrl(_url: string): Promise<Partial<CreateJobInput>> {
    // TODO: Fetch page HTML → strip → pass to AIService.extractJobData
    throw new Error("JobIntakeService.parseJobFromUrl not implemented");
  }

  /**
   * TODO: Parse a pasted job description via AI.
   */
  async parseJobFromText(_text: string): Promise<Partial<CreateJobInput>> {
    // TODO: AIService.extractJobData(text)
    throw new Error("JobIntakeService.parseJobFromText not implemented");
  }

  /**
   * TODO: Run the full intake pipeline: parse → check duplicate → save → create Drive folder.
   */
  async ingest(_input: CreateJobInput): Promise<{ jobId: string; isDuplicate: boolean }> {
    // TODO: DuplicateProtectionService.check → JobModel.create → DriveService.createFolder
    throw new Error("JobIntakeService.ingest not implemented");
  }
}
