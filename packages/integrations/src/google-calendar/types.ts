export interface IntegrationConfig {
  tenantId: string;
}

export type CreateCalendarEventInput = {
  tenantId: string;
  interviewId: string;
  title: string;
  startTime: string;
  endTime?: string;
  description?: string;
  attendees?: string[];
};

export type UpdateCalendarEventInput = {
  tenantId: string;
  calendarEventId: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
};

export type DeleteCalendarEventInput = {
  tenantId: string;
  calendarEventId: string;
};
