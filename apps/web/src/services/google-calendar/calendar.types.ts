export interface CalendarEventAttendee {
  email:         string;
  displayName?:  string;
  responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
}

export interface CalendarEvent {
  id:          string;
  summary:     string;
  description?: string;
  location?:   string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?:   CalendarEventAttendee[];
  htmlLink?:    string;
  status:       "confirmed" | "tentative" | "cancelled";
  created:      string;
  updated:      string;
}
