import { SectionCard } from "@/components/shared/SectionCard";
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
  return (
    <SectionCard
      title="Upcoming Interviews"
      description="Track scheduling details, prep readiness, and quick actions."
      contentClassName="space-y-3"
    >
      {interviews.map((interview) => (
        <InterviewCard key={interview.id} interview={interview} onView={onView} onMarkComplete={onMarkComplete} />
      ))}
    </SectionCard>
  );
}
