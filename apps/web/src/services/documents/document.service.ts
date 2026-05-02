// TODO: Manage document creation, versioning, and Drive sync.

import type { CreateDocumentInput } from "@/types/document";

export class DocumentService {
  /**
   * TODO: Create a new document record and optionally upload to Drive.
   */
  async create(_input: CreateDocumentInput): Promise<{ documentId: string; driveUrl?: string }> {
    throw new Error("DocumentService.create not implemented");
  }

  /**
   * TODO: Generate a tailored CV for a specific job using AI.
   */
  async generateTailoredCV(_jobId: string, _baseCVDocumentId: string): Promise<string> {
    // Returns new documentId
    throw new Error("DocumentService.generateTailoredCV not implemented");
  }

  /**
   * TODO: Generate a cover letter for a specific job using AI.
   */
  async generateCoverLetter(_jobId: string): Promise<string> {
    throw new Error("DocumentService.generateCoverLetter not implemented");
  }

  /**
   * TODO: Route (copy) a CV file to the job's Drive folder.
   */
  async routeCVToJobFolder(_documentId: string, _jobId: string): Promise<void> {
    throw new Error("DocumentService.routeCVToJobFolder not implemented");
  }
}
