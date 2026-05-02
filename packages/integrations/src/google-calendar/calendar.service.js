function makeEventId(tenantId, interviewId) {
    const sanitize = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `gcal-${sanitize(tenantId)}-${sanitize(interviewId)}`;
}
export async function createCalendarEventStub(input) {
    const calendarEventId = makeEventId(input.tenantId, input.interviewId);
    return {
        calendarEventId,
        calendarEventUrl: `https://calendar.stub.local/events/${calendarEventId}`,
        createdAt: new Date().toISOString(),
        status: "Created",
    };
}
export async function updateCalendarEventStub(input) {
    return {
        calendarEventId: input.calendarEventId,
        updatedAt: new Date().toISOString(),
        status: "Updated",
    };
}
export async function deleteCalendarEventStub(input) {
    return {
        calendarEventId: input.calendarEventId,
        deletedAt: new Date().toISOString(),
        status: "Deleted",
    };
}
