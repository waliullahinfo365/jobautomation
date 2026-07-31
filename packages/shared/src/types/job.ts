import type { jobStatuses } from "../constants/statuses";
export type JobStatus = (typeof jobStatuses)[number];
export type JobPriority = "Low" | "Medium" | "High" | "Urgent";
export interface Job { id: string; tenantId: string; createdBy: string; company: string; position: string; source?: string; status: JobStatus; priority: JobPriority; location?: string; jobUrl?: string; salaryRange?: string; deadline?: string; dateFound?: string; dateApplied?: string; contactEmail?: string; description?: string; aiSummary?: string; duplicateStatus?: "Unique" | "Duplicate" | "Possible Duplicate" | "Skipped"; duplicateOfJobId?: string; folderCreated?: boolean; driveFolderId?: string; driveFolderUrl?: string; folderProvisionStatus?: "Not Started" | "Queued" | "Completed" | "Failed"; folderProvisionedAt?: string; folderProvisionError?: string; tags?: string[]; notes?: string; rawSourceData?: Record<string, unknown>; aiProcessingStatus?: "Not Started" | "Queued" | "Processing" | "Completed" | "Failed"; aiProcessingStartedAt?: string; aiProcessingCompletedAt?: string; aiProcessingError?: string; researchGenerated?: boolean; draftGenerated?: boolean; lastAiRunAt?: string; createdAt: string; updatedAt: string; }

export interface JobIntakeEmailPayload {
  provider: "gmail" | "unipile" | "manual" | "test";
  providerMessageId: string;
  providerThreadId?: string;
  from: string;
  subject: string;
  bodyText: string;
  receivedAt: string;
  labels?: string[];
  raw?: Record<string, unknown>;
}

export interface JobExtractionResult {
  company: string;
  position: string;
  location?: string;
  jobUrl?: string;
  salaryRange?: string;
  deadline?: string;
  contactEmail?: string;
  description?: string;
  source: string;
  confidence: number;
  tags?: string[];
  raw?: Record<string, unknown>;
}

export interface DuplicateCheckResult {
  status: "Unique" | "Possible Duplicate" | "Duplicate" | "Skipped";
  duplicateOfJobId?: string;
  duplicateScore: number;
  reasons: string[];
}

export interface JobIntakeResult {
  operationId: string;
  tenantId: string;
  status: "created" | "updated" | "duplicate" | "skipped" | "failed";
  jobId?: string;
  duplicateCheck: DuplicateCheckResult;
  extraction?: JobExtractionResult;
  logs: string[];
}

export type AiRunType = "job-extraction" | "research-generation" | "draft-generation" | "reply-classification";
export type AiProcessingStatus = "Not Started" | "Queued" | "Processing" | "Completed" | "Failed";
export type DocumentGenerationStatus = "Pending" | "Generated" | "Failed" | "Needs Review";

export interface AiProcessingRequest {
  tenantId: string;
  jobId: string;
  runType: AiRunType;
  requestedBy: string;
  operationId?: string;
  promptVersion?: string;
}

export interface AiProcessingResult {
  operationId: string;
  tenantId: string;
  jobId: string;
  runType: AiRunType;
  status: AiProcessingStatus;
  documentsCreated: string[];
  summary: string;
  usage: {
    estimatedCredits: number;
  };
}

export interface FolderProvisionResult {
  operationId: string;
  tenantId: string;
  jobId: string;
  status: "completed" | "existing" | "failed";
  folderId?: string;
  folderUrl?: string;
  foldersCreated: string[];
  message: string;
}

export interface ResearchGenerationResult {
  documentId: string;
  company: string;
  position: string;
  summary: string;
  keyRequirements: string[];
  companyResearch: string;
  recommendedTalkingPoints: string[];
}

export interface DraftGenerationResult {
  documentId: string;
  company: string;
  position: string;
  draftText: string;
  subject?: string;
  keyCustomizations?: string[];
}
