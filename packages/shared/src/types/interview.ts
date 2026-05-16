import type { interviewStatuses, interviewTypes, prepStatuses } from "../constants/statuses";
export type InterviewType = (typeof interviewTypes)[number];
export type InterviewStatus = (typeof interviewStatuses)[number];
export type PrepStatus = (typeof prepStatuses)[number];
export interface InterviewPrepChecklistItem { label: string; done: boolean; }
export interface Interview { id: string; tenantId: string; createdBy: string; jobId?: string; applicationId?: string; company: string; position: string; interviewType: InterviewType; status: InterviewStatus; dateTime: string; durationMinutes?: number; interviewerName?: string; interviewerRole?: string; contactEmail?: string; meetingLink?: string; location?: string; prepStatus: PrepStatus; calendarStatus?: "Not Created" | "Queued" | "Created" | "Failed"; calendarEventId?: string; calendarEventUrl?: string; calendarCreatedAt?: string; calendarError?: string; notesSummary?: string; aiPrepSummary?: string; followUpMessagePreview?: string; prepChecklist?: InterviewPrepChecklistItem[]; createdAt: string; updatedAt: string; }

export interface CalendarEventResult {
  operationId: string;
  tenantId: string;
  interviewId: string;
  status: "created" | "existing" | "failed" | "pending" | "skipped";
  calendarEventId?: string;
  calendarEventUrl?: string;
  message: string;
}
