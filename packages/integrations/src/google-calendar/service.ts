export { createCalendarEventStub, deleteCalendarEventStub, updateCalendarEventStub } from "./calendar.service";

export const service = {
  connect: async () => ({ connected: false, provider: "google-calendar-stub" }),
};
