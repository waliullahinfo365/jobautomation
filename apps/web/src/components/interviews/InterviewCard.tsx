"use client";

import {
  CalendarDaysIcon,
  Clock3Icon,
  ExternalLinkIcon,
  User2Icon,
} from "@/components/icons";
import type { Interview } from "@/types/interview";
import { MotionCard } from "@/components/shared/MotionCard";
import { Button } from "@/components/ui/button";
import { InterviewTypeBadge } from "./InterviewTypeBadge";
import { InterviewStatusBadge } from "./InterviewStatusBadge";
import { PrepStatusBadge } from "./PrepStatusBadge";
import { useTranslation } from "@/i18n/useTranslation";

interface InterviewCardProps {
  interview: Interview;
  onView: (interview: Interview) => void;
  onMarkComplete: (interviewId: string) => void;
  onReschedule?: (interview: Interview) => void;
}

export function InterviewCard({ interview, onView, onMarkComplete, onReschedule }: InterviewCardProps) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <MotionCard className="mobile-list-card hover-lift p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold leading-snug">{interview.company}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{interview.position}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <InterviewTypeBadge type={interview.interviewType} />
          <InterviewStatusBadge status={interview.status} />
          <PrepStatusBadge status={interview.prepStatus} />
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDaysIcon size={14} className="shrink-0" /> {dateFmt.format(new Date(interview.dateTime))}
        </span>
        <span className="flex items-center gap-1">
          <Clock3Icon size={14} className="shrink-0" /> {interview.durationMinutes} {t("common.minutesSuffix")}
        </span>
        <span className="flex items-center gap-1">
          <User2Icon size={14} className="shrink-0" /> {interview.interviewerName}
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-muted/70 p-2 text-xs text-muted-foreground break-words">
        {t("interviews.card.contact")}: {interview.contactEmail}
        <br />
        {t("interviews.card.link")}: {interview.meetingLink}
      </div>

      <div className="mobile-card-actions mt-4">
        <Button size="sm" variant="outline" className="min-h-[44px]" onClick={() => onView(interview)}>{t("button.view")}</Button>
        <Button size="sm" variant="secondary" className="min-h-[44px]" onClick={() => onMarkComplete(interview.id)}>{t("button.markComplete")}</Button>
        <Button size="sm" variant="ghost" className="min-h-[44px]" onClick={() => onReschedule ? onReschedule(interview) : onView(interview)}>
          {t("button.reschedule")}
        </Button>
        {interview.meetingLink ? (
          <Button
            size="sm"
            variant="ghost"
            className="min-h-[44px]"
            onClick={() => window.open(interview.meetingLink, "_blank", "noopener,noreferrer")}
          >
            {t("interviews.card.openMeeting")}
            <ExternalLinkIcon size={14} className="ml-1" />
          </Button>
        ) : null}
      </div>
    </MotionCard>
  );
}
