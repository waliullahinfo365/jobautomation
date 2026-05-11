import {
  CalendarDaysIcon,
  Clock3Icon,
  ExternalLinkIcon,
  User2Icon,
} from "@/components/icons";
import { formatDate } from "@/lib/utils";
import type { Interview } from "@/types/interview";
import { MotionCard } from "@/components/shared/MotionCard";
import { Button } from "@/components/ui/button";
import { InterviewTypeBadge } from "./InterviewTypeBadge";
import { InterviewStatusBadge } from "./InterviewStatusBadge";
import { PrepStatusBadge } from "./PrepStatusBadge";
import { useTranslation } from "@/i18n/I18nProvider";

interface InterviewCardProps {
  interview: Interview;
  onView: (interview: Interview) => void;
  onMarkComplete: (interviewId: string) => void;
}

export function InterviewCard({ interview, onView, onMarkComplete }: InterviewCardProps) {
  const { t } = useTranslation();
  return (
    <MotionCard className="hover-lift p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-sm">{interview.company}</p>
          <p className="text-xs text-muted-foreground">{interview.position}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <InterviewTypeBadge type={interview.interviewType} />
          <InterviewStatusBadge status={interview.status} />
          <PrepStatusBadge status={interview.prepStatus} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDaysIcon size={14} /> {formatDate(interview.dateTime, "MMM d, yyyy HH:mm")}
        </span>
        <span className="flex items-center gap-1">
          <Clock3Icon size={14} /> {interview.durationMinutes} {t("common.minutesSuffix")}
        </span>
        <span className="flex items-center gap-1">
          <User2Icon size={14} /> {interview.interviewerName}
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-muted/70 p-2 text-xs text-muted-foreground">
        Contact: {interview.contactEmail}
        <br />
        Link: {interview.meetingLink}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onView(interview)}>{t("button.view")}</Button>
        <Button size="sm" variant="secondary" onClick={() => onMarkComplete(interview.id)}>{t("button.markComplete")}</Button>
        <Button size="sm" variant="ghost">{t("button.reschedule")}</Button>
        <Button size="sm" variant="ghost">
          Open Meeting
          <ExternalLinkIcon size={14} className="ml-1" />
        </Button>
      </div>
    </MotionCard>
  );
}
