"use client";

import { CheckCircleIcon, CircleDotIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";
import type { InterviewTimelineEvent } from "@/types/interview";

interface InterviewTimelineProps {
  events: InterviewTimelineEvent[];
}

export function InterviewTimeline({ events }: InterviewTimelineProps) {
  const { locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-0">
      {events.map((event, i) => (
        <div key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            {event.status === "completed" ? (
              <CheckCircleIcon size={18} className="text-[var(--emerald)]" />
            ) : (
              <CircleDotIcon size={18} className="text-[var(--text-4)]" />
            )}
            {i < events.length - 1 ? <div className="my-1 w-px flex-1 bg-[var(--border-default)]" /> : null}
          </div>
          <div className="pb-4">
            <p className="text-sm font-medium text-[var(--text-1)]">{event.title}</p>
            <p className="text-xs text-[var(--text-3)]">{event.detail}</p>
            <p className="mt-1 text-xs text-[var(--text-4)]">{dateFmt.format(new Date(event.timestamp))}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
