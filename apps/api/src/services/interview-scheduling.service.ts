import { randomUUID } from "node:crypto";
import { InterviewModel } from "@jobflow/database/models";
import { processInterviewSchedulingJob } from "@jobflow/workers/processors/interview-scheduling";
import type { CalendarEventResult } from "@jobflow/shared/types/interview";
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
    // Use the real worker processor — checks Google Calendar connection, calls live API,
    // stores real event URL. Falls back gracefully when Calendar is not connected.
    const result = await processInterviewSchedulingJob({
      tenantId,
      interviewId: input.interviewId,
      userId: input.userId,
      operationId,
    });

    if ((result as any).pendingCalendarConnection) {
      return {
        operationId,
        tenantId,
        interviewId: input.interviewId,
        status: "pending",
        calendarEventId: undefined,
        calendarEventUrl: undefined,
        message: "Google Calendar not connected. Connect it in Settings → Integrations.",
      };
    }

    if ((result as any).skipped) {
      return {
        operationId,
        tenantId,
        interviewId: input.interviewId,
        status: "skipped",
        calendarEventId: undefined,
        calendarEventUrl: undefined,
        message: (result as any).reason ?? "Calendar event skipped",
      };
    }

    return {
      operationId,
      tenantId,
      interviewId: input.interviewId,
      status: (result as any).existing ? "existing" : "created",
      calendarEventId: (result as any).calendarEventId,
      calendarEventUrl: (result as any).calendarEventLink,
      message: (result as any).existing ? "Calendar event already exists" : "Calendar event created",
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
