import type { CreateCalendarEventInput, DeleteCalendarEventInput, UpdateCalendarEventInput } from "./types";

function makeEventId(tenantId: string, interviewId: string): string {
  const sanitize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `gcal-${sanitize(tenantId)}-${sanitize(interviewId)}`;
}

export async function createCalendarEventStub(input: CreateCalendarEventInput) {
  const calendarEventId = makeEventId(input.tenantId, input.interviewId);
  return {
    calendarEventId,
    calendarEventUrl: `https://calendar.stub.local/events/${calendarEventId}`,
    createdAt: new Date().toISOString(),
    status: "Created" as const,
  };
}

export async function updateCalendarEventStub(input: UpdateCalendarEventInput) {
  return {
    calendarEventId: input.calendarEventId,
    updatedAt: new Date().toISOString(),
    status: "Updated" as const,
  };
}

export async function deleteCalendarEventStub(input: DeleteCalendarEventInput) {
  return {
    calendarEventId: input.calendarEventId,
    deletedAt: new Date().toISOString(),
    status: "Deleted" as const,
  };
}
