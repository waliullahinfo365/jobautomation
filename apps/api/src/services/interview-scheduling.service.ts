import { randomUUID } from "node:crypto";
import { InterviewModel } from "@database/models";
import { createCalendarEventStub } from "@integrations/google-calendar/calendar.service";
import type { CalendarEventResult } from "@shared/types/interview";
import { createAutomationLog } from "./automation-log.service";
import { assertTenantId, findTenantScopedById } from "./baseTenant.service";
import { ApiError } from "../utils/errors";

type CreateCalendarInput = {
  tenantId: string;
  interviewId: string;
  userId: string;
  operationId?: string;
};

export async function createInterviewCalendarEvent(input: CreateCalendarInput): Promise<CalendarEventResult> {
  const tenantId = assertTenantId(input.tenantId);
  const operationId = input.operationId ?? randomUUID();
  const interview = await findTenantScopedById(InterviewModel, tenantId, input.interviewId);
  if (!interview) throw new ApiError("Interview not found", 404, "NOT_FOUND");

  const idempotencyKey = `interview-scheduling:${tenantId}:${input.interviewId}:${new Date(interview.dateTime).toISOString()}`;
  if (interview.calendarEventId && interview.calendarStatus === "Created") {
    return {
      operationId,
      tenantId,
      interviewId: input.interviewId,
      status: "existing",
      calendarEventId: interview.calendarEventId,
      calendarEventUrl: interview.calendarEventUrl,
      message: "Calendar event already exists",
    };
  }

  await InterviewModel.findByIdAndUpdate(interview._id, { calendarStatus: "Queued", calendarError: undefined });

  try {
    const event = await createCalendarEventStub({
      tenantId,
      interviewId: input.interviewId,
      title: `${interview.company} - ${interview.position}`,
      startTime: new Date(interview.dateTime).toISOString(),
      description: interview.notesSummary,
      attendees: interview.contactEmail ? [interview.contactEmail] : [],
    });

    await InterviewModel.findByIdAndUpdate(interview._id, {
      calendarStatus: "Created",
      calendarEventId: event.calendarEventId,
      calendarEventUrl: event.calendarEventUrl,
      calendarCreatedAt: new Date(event.createdAt),
      calendarError: undefined,
    });

    await createAutomationLog({
      tenantId,
      moduleKey: "interview-scheduling",
      moduleName: "Interview Scheduling",
      status: "Success",
      message: "Interview calendar event created",
      relatedRecordType: "Interview",
      relatedRecordId: input.interviewId,
      operationId,
      idempotencyKey,
      metadata: { calendarEventId: event.calendarEventId, calendarEventUrl: event.calendarEventUrl },
    });

    return {
      operationId,
      tenantId,
      interviewId: input.interviewId,
      status: "created",
      calendarEventId: event.calendarEventId,
      calendarEventUrl: event.calendarEventUrl,
      message: "Calendar event created",
    };
  } catch (error) {
    await InterviewModel.findByIdAndUpdate(interview._id, {
      calendarStatus: "Failed",
      calendarError: error instanceof Error ? error.message : "Unknown error",
    });
    await createAutomationLog({
      tenantId,
      moduleKey: "interview-scheduling",
      moduleName: "Interview Scheduling",
      status: "Failed",
      message: "Interview calendar event creation failed",
      relatedRecordType: "Interview",
      relatedRecordId: input.interviewId,
      operationId,
      idempotencyKey,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
