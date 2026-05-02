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

export type JobSource = "Gmail" | "LinkedIn" | "Indeed" | "Company Website" | "Referral" | "Manual";

export interface JobDocument {
  id: string;
  fileName: string;
  type: "CV" | "Cover Letter" | "Research" | "Final PDF";
  status: "Draft" | "Ready" | "Generated" | "Sent";
  url: string;
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

  documents: JobDocument[];
  timeline: JobTimelineEvent[];
  automationLogs: JobAutomationLog[];

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
