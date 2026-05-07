export type JobStatus =
  | "New"
  | "Research"
  | "Drafting"
  | "Ready to Apply"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Archived";

export type JobPriority = "Low" | "Medium" | "High" | "Urgent";

export type JobSource = "Gmail" | "LinkedIn" | "Indeed" | "Company Website" | "Referral" | "Manual" | "Other";

export interface JobDocument {
  id: string;
  fileName: string;
  type: "CV" | "Cover Letter" | "Research" | "Final PDF" | "Other";
  status: "Draft" | "Ready" | "Generated" | "Sent" | "Archived";
  url: string;
  createdAt?: string;
  documentKind?: string;
  contentPreview?: string;
  /** Present for API-loaded documents; used in the view modal. */
  contentText?: string;
  googleDocUrl?: string;
}

export interface JobTimelineEvent {
  id: string;
  title: string;
  detail: string;
  timestamp: Date | string;
  status: "completed" | "pending";
}

export interface JobAutomationLog {
  id: string;
  event: string;
  detail: string;
  timestamp: Date | string;
  status: "success" | "warning" | "error";
  moduleKey?: string;
  /** Backend automation log `error` field when status is Failed */
  error?: string;
  raw?: Record<string, unknown>;
}

/** Workspace CV / cover letter text available for AI job automation (from GET /jobs/:id). */
export interface ProfileDocumentContext {
  hasCvContent: boolean;
  hasCoverLetterContent: boolean;
}

export interface Job {
  id: string;
  _id: string; // compatibility alias for existing routes/components

  company: string;
  position: string;
  title: string; // compatibility alias

  source: JobSource;
  status: JobStatus;
  priority: JobPriority;

  location: string;
  remote: boolean;
  jobUrl: string;
  url: string; // compatibility alias
  salaryRange: string;

  deadline?: Date | string;
  dateFound: Date | string;
  dateApplied?: Date | string;
  lastUpdated: Date | string;
  createdAt: Date | string; // compatibility alias
  updatedAt: Date | string; // compatibility alias

  contactEmail?: string;
  description: string;
  aiSummary: string;
  duplicateStatus: "Checked" | "Potential Duplicate" | "Skipped Duplicate";
  folderCreated: boolean;
  driveFolderLink?: string;
  researchFolderLink?: string;
  coverLetterFolderLink?: string;
  cvFolderLink?: string;
  applicationProofFolderLink?: string;
  interviewPrepFolderLink?: string;
  aiDraftDocUrl?: string;

  documents: JobDocument[];
  timeline: JobTimelineEvent[];
  automationLogs: JobAutomationLog[];

  /** Present when API attaches profile workspace document flags. */
  profileDocumentContext?: ProfileDocumentContext;

  tags: string[];
  notes?: string;
  contactIds: string[];
}

export interface JobSummary
  extends Pick<
    Job,
    "id" | "_id" | "position" | "title" | "company" | "location" | "source" | "status" | "priority" | "salaryRange" | "deadline" | "dateFound" | "lastUpdated" | "createdAt" | "updatedAt"
  > {
  applicationCount: number;
}

export type CreateJobInput = Omit<
  Job,
  "_id" | "id" | "createdAt" | "updatedAt" | "dateFound" | "lastUpdated" | "documents" | "timeline" | "automationLogs"
>;

export type UpdateJobInput = Partial<CreateJobInput>;

export interface JobFilters {
  query?: string;
  status?: JobStatus | "All";
  priority?: JobPriority | "All";
  source?: JobSource | "All";
  remote?: boolean;
}
