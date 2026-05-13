export type DocumentTab =
  | "All Documents"
  | "CV Library"
  | "Cover Letters"
  | "Research Docs"
  | "PDF Exports"
  | "Folder Automation";

export type DocumentType =
  | "CV"
  | "Cover Letter"
  | "Cover Letter Template"
  | "Research Document"
  | "PDF Export"
  | "Job Folder"
  | "Email Template"
  | "Supporting Document"
  | "AI Draft";

export type DocumentStatus = "Draft" | "Ready" | "Exported" | "Failed" | "Needs Review" | "Archived";

export type PDFExportStatus = "Pending" | "Exported" | "Failed" | "Needs Review" | "Preview Only";

export interface DocumentRecord {
  id: string;
  _id: string;
  fileName: string;
  type: DocumentType;
  relatedJob: string;
  company: string;
  position: string;
  status: DocumentStatus;
  storageLocation: string;
  lastUpdated: Date | string;
  /** Set when linked to a job (API / routing) */
  jobId?: string;
  /** Public or drive URL when available */
  storageUrl?: string;
  /** From PDF export pipeline */
  pdfExportStatus?: PDFExportStatus;
  pdfUrl?: string;
  /** CV routing status from API */
  routingStatus?: "Not Started" | "Queued" | "Completed" | "Failed";
  profileDocumentType?: "cv_resume" | "cover_letter_template" | "supporting_document";
  isActiveProfileDocument?: boolean;
  driveFileLink?: string;
  driveFileId?: string;
  extractionStatus?: "Provided" | "Failed" | "Not Required";
  extractionError?: string;
}

export interface CVVersion {
  id: string;
  cvName: string;
  targetRole: string;
  industry: string;
  version: string;
  status: DocumentStatus;
  usedInApplicationsCount: number;
  isDefault: boolean;
  lastUpdated: Date | string;
}

export interface CoverLetterRecord {
  id: string;
  fileName: string;
  company: string;
  position: string;
  relatedJob: string;
  status: DocumentStatus;
  aiGenerated: boolean;
  pdfExportStatus: PDFExportStatus;
  lastUpdated: Date | string;
}

export interface ResearchDocumentRecord {
  id: string;
  documentName: string;
  company: string;
  position: string;
  researchStatus: DocumentStatus;
  aiSummarySnippet: string;
  createdAt: Date | string;
}

export interface PDFExportRecord {
  id: string;
  documentName: string;
  sourceType: DocumentType;
  relatedJob: string;
  exportStatus: PDFExportStatus;
  createdAt: Date | string;
  exportPublicUrl: string;
  textPreviewAvailable: boolean;
  pdfLink: string;
}

export interface FolderActivityRecord {
  id: string;
  time: Date | string;
  job: string;
  action: string;
  folderPath: string;
  status: "Success" | "Warning" | "Failed";
}

export interface FolderAutomationSettings {
  autoCreateFolderOnNewJob: boolean;
  moveCVOnReadyToApply: boolean;
  exportFinalDocumentsAsPDF: boolean;
  namingConvention: string;
}

// compatibility alias for existing components
export interface Document {
  _id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  jobId?: string;
  applicationId?: string;
  driveFileId?: string;
  driveUrl?: string;
  content?: string;
  version: number;
  generatedByAI: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type CreateDocumentInput = Omit<Document, "_id" | "createdAt" | "updatedAt" | "version"> & { version?: number };
export type UpdateDocumentInput = Partial<CreateDocumentInput>;
