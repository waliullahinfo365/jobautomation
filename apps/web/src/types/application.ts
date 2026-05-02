export type ApplicationStatus =
  | "Drafted"
  | "Ready"
  | "Applied"
  | "Follow-Up Due"
  | "Replied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Archived";

export type ResponseStatus = "No Response" | "Positive Reply" | "Negative Reply" | "Auto Reply" | "Needs Review";

export type FollowUpStatus = "Not Needed" | "Scheduled" | "Due Today" | "Overdue" | "Sent";

export interface ApplicationTimelineEvent {
  id: string;
  title: string;
  detail: string;
  timestamp: Date | string;
  status: "completed" | "pending";

  // compatibility fields used in prior components
  date?: Date | string;
  note?: string;
}

export interface ApplicationAutomationLog {
  id: string;
  engine: string;
  event: string;
  detail: string;
  timestamp: Date | string;
  status: "success" | "warning" | "error";
}

export interface Application {
  id: string;
  _id: string; // compatibility alias
  jobId: string;
  company: string;
  position: string;
  source: string;

  applicationStatus: ApplicationStatus;
  responseStatus: ResponseStatus;
  followUpStatus: FollowUpStatus;
  status: ApplicationStatus; // compatibility alias for older components

  dateFound: Date | string;
  dateApplied?: Date | string;
  followUpDate?: Date | string;
  contactEmail: string;
  jobUrl: string;

  automationHealth: "Healthy" | "Warning" | "Attention Needed";
  lastEmailSubject?: string;
  lastReplySnippet?: string;
  responseDetected: boolean;
  aiClassification: string;

  followUpMessagePreview?: string;
  reminderStatus: FollowUpStatus;
  reminderSentDate?: Date | string;

  timeline: ApplicationTimelineEvent[];
  automationLogs: ApplicationAutomationLog[];

  createdAt: Date | string;
  updatedAt: Date | string;

  // compatibility fields from previous model
  userId?: string;
  appliedAt?: Date | string;
  cvVersion?: string;
  coverLetter?: string;
  notes?: string;
  followUpSentAt?: Date | string;
  responseReceivedAt?: Date | string;
  interviewIds?: string[];

  /** Gmail thread id when synced — used by reply-test demo */
  providerThreadId?: string;
}

export type CreateApplicationInput = Omit<Application, "_id" | "id" | "createdAt" | "updatedAt" | "timeline" | "automationLogs">;

export type UpdateApplicationInput = Partial<CreateApplicationInput> & {
  addEvent?: ApplicationTimelineEvent;
};
