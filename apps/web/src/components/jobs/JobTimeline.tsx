import { CheckCircleIcon, CircleDotIcon } from "@/components/icons";
import { formatDate } from "@/lib/utils";
import type { JobTimelineEvent } from "@/types/job";

interface JobTimelineProps {
  timeline: JobTimelineEvent[];
}

export function JobTimeline({ timeline }: JobTimelineProps) {
  return (
    <div className="space-y-0">
      {timeline.map((event, i) => (
        <div key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            {event.status === "completed" ? (
              <CheckCircleIcon size={18} className="text-[var(--emerald)]" />
            ) : (
              <CircleDotIcon size={18} className="text-[var(--text-4)]" />
            )}
            {i < timeline.length - 1 ? <div className="my-1 w-px flex-1 bg-[var(--border-default)]" /> : null}
          </div>
          <div className="pb-4">
            <p className="text-sm font-medium text-[var(--text-1)]">{event.title}</p>
            <p className="text-xs text-[var(--text-3)]">{event.detail}</p>
            <p className="mt-1 text-xs text-[var(--text-4)]">{formatDate(event.timestamp, "MMM d, yyyy HH:mm")}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
