"use client";

import type { Interview } from "@/types/interview";
import { CalendarWeekView } from "./CalendarWeekView";

interface InterviewCalendarProps {
  interviews: Interview[];
}

export function InterviewCalendar({ interviews }: InterviewCalendarProps) {
  return <CalendarWeekView interviews={interviews} />;
}
