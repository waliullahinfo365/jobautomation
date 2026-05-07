import { AutomationLogModel, InterviewModel, JobModel } from "@jobflow/database/models";
import { googleApiJson, loadGoogleAccessToken } from "../lib/google-auth";

export type InterviewSchedulingPayload = {
  tenantId: string;
  interviewId: string;
  userId: string;
  operationId?: string;
};

export async function processInterviewSchedulingJob(payload: InterviewSchedulingPayload) {
  const operationId = payload.operationId ?? `interview-scheduling-${Date.now()}`;
  const interview = await InterviewModel.findOne({
    tenantId: payload.tenantId,
    _id: payload.interviewId,
  }).lean();
  if (!interview) throw new Error(`Interview not found: ${payload.interviewId}`);

  const stage = String((interview as Record<string, unknown>).interviewType ?? "");
  const supported = new Set(["Phone Screen", "Interview 1", "Interview 2", "Case Study", "Final Round"]);
  if (!supported.has(stage)) {
    return {
      suppressWorkerCompletionLog: true as const,
      moduleKey: "interview-scheduling",
      status: "completed",
      operationId,
      skipped: true,
      reason: `Stage not configured for prep event: ${stage || "unknown"}`,
    };
  }

  if ((interview as Record<string, unknown>).calendarEventId) {
    return {
      suppressWorkerCompletionLog: true as const,
      moduleKey: "interview-scheduling",
      status: "completed",
      operationId,
      existing: true,
      calendarEventId: String((interview as Record<string, unknown>).calendarEventId),
    };
  }

  const job = (interview as Record<string, unknown>).jobId
    ? await JobModel.findOne({ tenantId: payload.tenantId, _id: String((interview as Record<string, unknown>).jobId) }).lean()
    : null;
  const driveLink =
    (job as Record<string, unknown> | null)?.driveFolderUrl ||
    (job as Record<string, unknown> | null)?.driveFolderLink;
  const auth = await loadGoogleAccessToken({
    tenantId: payload.tenantId,
    provider: "Google Calendar",
    requiredScopes: ["https://www.googleapis.com/auth/calendar.events"],
  });
  if (!auth.connected) {
    const reconnectRequired = auth.reason === "Google reconnect required: demo connection cannot call Google APIs.";
    await AutomationLogModel.create({
      tenantId: payload.tenantId,
      createdBy: "system",
      moduleKey: "interview-scheduling",
      moduleName: "interview-scheduling",
      status: "Warning",
      message: reconnectRequired
        ? "Google reconnect required: demo connection cannot call Google APIs."
        : `Calendar event skipped: ${auth.reason ?? "Calendar integration unavailable"}`,
      operationId,
      relatedRecordType: "Interview",
      relatedRecordId: payload.interviewId,
      metadata: {
        reason: auth.reason,
        reconnectRequired,
        demoConnection: reconnectRequired,
        provider: "google-calendar",
      },
    });
    return {
      suppressWorkerCompletionLog: true as const,
      moduleKey: "interview-scheduling",
      status: "completed",
      operationId,
      pendingCalendarConnection: true,
    };
  }

  const interviewDate = new Date(String((interview as Record<string, unknown>).dateTime));
  const endDate = new Date(interviewDate.getTime() + 90 * 60 * 1000);
  const company = String((interview as Record<string, unknown>).company ?? "Company");
  const position = String((interview as Record<string, unknown>).position ?? "Position");

  const desc = [
    "Review job description",
    "Review CV + key achievements",
    "Prepare 5 STAR stories",
    "Research company",
    "Prepare questions",
    ...(driveLink ? [`Drive folder: ${String(driveLink)}`] : []),
  ].join("\n- ");

  const event = await googleApiJson<{ id: string; htmlLink?: string }>({
    url: "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    method: "POST",
    accessToken: auth.accessToken,
    body: {
      summary: `Interview Prep — ${company} — ${position}`,
      description: `- ${desc}`,
      start: { dateTime: interviewDate.toISOString() },
      end: { dateTime: endDate.toISOString() },
    },
  });

  await InterviewModel.findByIdAndUpdate(payload.interviewId, {
    calendarStatus: "Created",
    calendarEventId: event.id,
    calendarEventUrl: event.htmlLink ?? `https://calendar.google.com/calendar/u/0/r/eventedit/${event.id}`,
    calendarEventLink: event.htmlLink ?? `https://calendar.google.com/calendar/u/0/r/eventedit/${event.id}`,
    calendarCreatedAt: new Date(),
    interviewPrepEventCreated: true,
    calendarError: undefined,
  });
  await AutomationLogModel.create({
    tenantId: payload.tenantId,
    createdBy: "system",
    moduleKey: "interview-scheduling",
    moduleName: "interview-scheduling",
    status: "Success",
    message: "Interview prep event created in Google Calendar.",
    operationId,
    relatedRecordType: "Interview",
    relatedRecordId: payload.interviewId,
    metadata: { calendarEventId: event.id, calendarEventLink: event.htmlLink },
  });
  return {
    suppressWorkerCompletionLog: true as const,
    moduleKey: "interview-scheduling",
    status: "completed",
    operationId,
    calendarEventId: event.id,
    calendarEventLink: event.htmlLink,
  };
}
