import { SectionCard } from "@/components/shared/SectionCard";
import { MotionCard } from "@/components/shared/MotionCard";
import { formatDate } from "@/lib/utils";
import type { Interview } from "@/types/interview";
import { InterviewTypeBadge } from "./InterviewTypeBadge";

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function CalendarWeekView({ interviews }: { interviews: Interview[] }) {
  const grouped = dayNames.map((name, idx) => ({
    name,
    items: interviews.filter((iv) => {
      const day = new Date(iv.dateTime).getDay();
      const normalized = day === 0 ? 6 : day - 1;
      return normalized === idx;
    }),
  }));

  return (
    <SectionCard title="Calendar View" description="Mock weekly calendar grouped by day." contentClassName="space-y-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {grouped.map((day) => (
          <div key={day.name} className="rounded-xl border border-border/70 bg-card/40 p-3">
            <p className="mb-2 text-sm font-semibold text-foreground">{day.name}</p>
            <div className="space-y-2">
              {day.items.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("interviews.noEvents")}</p>
              ) : (
                day.items.map((iv) => (
                  <MotionCard key={iv.id} className="p-2">
                    <p className="text-xs font-semibold text-foreground">{iv.company}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(iv.dateTime, "HH:mm")} · {iv.position}</p>
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
