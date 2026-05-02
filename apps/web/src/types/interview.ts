export type InterviewType =
  | "Recruiter Screen"
  | "Technical"
  | "Behavioral"
  | "Hiring Manager"
  | "Panel"
  | "Final Round"
  | "Offer Discussion";

export type InterviewStatus =
  | "Scheduled"
  | "Awaiting Confirmation"
  | "Rescheduled"
  | "Completed"
  | "Cancelled"
  | "No Show";

export type PrepStatus = "Not Started" | "In Progress" | "Ready" | "Overdue";

export type PrepTaskStatus = "Not Started" | "In Progress" | "Done" | "Overdue";

export type PrepTaskType =
  | "Research Company"
  | "Review Job Description"
  | "Practice Answers"
  | "Technical Prep"
  | "Prepare Questions"
  | "Portfolio Review";

export type InterviewOutcome = "Waiting Feedback" | "Advanced" | "Rejected" | "Offer" | "No Feedback";

export type InterviewTab =
  | "Upcoming"
  | "Calendar View"
  | "Prep Tasks"
  | "Completed"
  | "Awaiting Confirmation"
  | "Automation Logs";

export interface InterviewPrepChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface InterviewTimelineEvent {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  status: "completed" | "pending";
}

export interface InterviewAutomationLog {
  id: string;
  time: string;
  module: "Interview Scheduling Automation" | "Email Reply Detection" | "Follow-Up Reminder Engine" | "Calendar Sync";
  status: "success" | "warning" | "error";
  message: string;
  relatedInterview: string;
  durationMs: number;
}

export interface Interview {
  id: string;
  _id?: string;
  jobId: string;
  applicationId: string;
  company: string;
  position: string;
  interviewType: InterviewType;
  status: InterviewStatus;
  dateTime: string;
  durationMinutes: number;
  interviewerName: string;
  interviewerRole: string;
  contactEmail: string;
  meetingLink: string;
  location: string;
  prepStatus: PrepStatus;
  /** UI: Synced = created on calendar; Pending = not yet / queued */
  calendarStatus: "Synced" | "Pending";
  calendarEventId: string;
  relatedJobStatus: string;
  notesSummary: string;
  aiPrepSummary: string;
  followUpMessagePreview: string;
  prepChecklist: InterviewPrepChecklistItem[];
  timeline: InterviewTimelineEvent[];
  automationLogs: InterviewAutomationLog[];
}

export interface PrepTask {
  id: string;
  interviewId: string;
  company: string;
  position: string;
  title: string;
  taskType: PrepTaskType;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  status: PrepTaskStatus;
}

export interface CompletedInterview {
  id: string;
  company: string;
  position: string;
  interviewType: InterviewType;
  completedDate: string;
  outcome: InterviewOutcome;
  notesSummary: string;
  followUpSent: boolean;
}

export interface AwaitingConfirmationInterview {
  id: string;
  company: string;
  position: string;
  proposedTime: string;
  contact: string;
  sourceEmailSubject: string;
  aiDetectedIntent: string;
}

export interface CalendarSyncStatus {
  googleCalendar: "Connected" | "Not connected";
  lastSync: string;
  nextSync: string;
}
