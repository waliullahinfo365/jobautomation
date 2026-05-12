"use client";

import { SectionCard } from "@/components/shared/SectionCard";
import { useTranslation } from "@/i18n/useTranslation";
import type { Interview } from "@/types/interview";
import { InterviewCard } from "./InterviewCard";

export function UpcomingInterviewsSection({
  interviews,
  onView,
  onMarkComplete,
}: {
  interviews: Interview[];
  onView: (interview: Interview) => void;
  onMarkComplete: (interviewId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <SectionCard
      title={t("interviews.upcoming.title")}
      description={t("interviews.upcoming.subtitle")}
      contentClassName="space-y-3"
    >
      {interviews.map((interview) => (
        <InterviewCard key={interview.id} interview={interview} onView={onView} onMarkComplete={onMarkComplete} />
      ))}
    </SectionCard>
  );
}
