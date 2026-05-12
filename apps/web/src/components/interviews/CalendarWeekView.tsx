"use client";

import { SectionCard } from "@/components/shared/SectionCard";
import { MotionCard } from "@/components/shared/MotionCard";
import { useTranslation } from "@/i18n/useTranslation";
import type { Interview } from "@/types/interview";
import { InterviewTypeBadge } from "./InterviewTypeBadge";

const dayI18nKeys = [
  "interviews.calendar.days.monday",
  "interviews.calendar.days.tuesday",
  "interviews.calendar.days.wednesday",
  "interviews.calendar.days.thursday",
  "interviews.calendar.days.friday",
  "interviews.calendar.days.saturday",
  "interviews.calendar.days.sunday",
];

export function CalendarWeekView({ interviews }: { interviews: Interview[] }) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const timeFmt = new Intl.DateTimeFormat(bcp47, { hour: "2-digit", minute: "2-digit", hour12: false });

  const grouped = dayI18nKeys.map((key, idx) => ({
    label: t(key),
    items: interviews.filter((iv) => {
      const day = new Date(iv.dateTime).getDay();
      const normalized = day === 0 ? 6 : day - 1;
      return normalized === idx;
    }),
  }));

  return (
    <SectionCard title={t("interviews.calendar.title")} description={t("interviews.calendar.subtitle")} contentClassName="space-y-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {grouped.map((day) => (
          <div key={day.label} className="rounded-xl border border-border/70 bg-card/40 p-3">
            <p className="mb-2 text-sm font-semibold text-foreground">{day.label}</p>
            <div className="space-y-2">
              {day.items.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("interviews.calendar.noEvents")}</p>
              ) : (
                day.items.map((iv) => (
                  <MotionCard key={iv.id} className="p-2">
                    <p className="text-xs font-semibold text-foreground">{iv.company}</p>
                    <p className="text-xs text-muted-foreground">{timeFmt.format(new Date(iv.dateTime))} · {iv.position}</p>
                    <div className="mt-1">
                      <InterviewTypeBadge type={iv.interviewType} />
                    </div>
                  </MotionCard>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
