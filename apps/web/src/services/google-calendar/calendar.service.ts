// TODO: Implement using googleapis (calendar_v3).
// Reference: https://developers.google.com/calendar/api/v3/reference

import type { CalendarEvent } from "./calendar.types";

export class CalendarService {
  private accessToken: string;
  private calendarId:  string;

  constructor(accessToken: string, calendarId = "primary") {
    this.accessToken = accessToken;
    this.calendarId  = calendarId;
  }

  /**
   * TODO: Create a calendar event for an interview or deadline.
   */
  async createEvent(_event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    // TODO: POST /calendar/v3/calendars/{calendarId}/events
    throw new Error("CalendarService.createEvent not implemented");
  }

  /**
   * TODO: Update an existing event (e.g. reschedule interview).
   */
  async updateEvent(_eventId: string, _updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    // TODO: PATCH /calendar/v3/calendars/{calendarId}/events/{eventId}
    throw new Error("CalendarService.updateEvent not implemented");
  }

  /**
   * TODO: Delete a calendar event.
   */
  async deleteEvent(_eventId: string): Promise<void> {
    // TODO: DELETE /calendar/v3/calendars/{calendarId}/events/{eventId}
    throw new Error("CalendarService.deleteEvent not implemented");
  }

  /**
   * TODO: List upcoming events within a date range.
   */
  async listEvents(_from: Date, _to: Date): Promise<CalendarEvent[]> {
    // TODO: GET /calendar/v3/calendars/{calendarId}/events?timeMin=...&timeMax=...
    throw new Error("CalendarService.listEvents not implemented");
  }
}
