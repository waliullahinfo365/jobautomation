import { Badge } from "@/components/ui/badge";
import type { InterviewType } from "@/types/interview";

const styles: Record<InterviewType, string> = {
  "Recruiter Screen":
    "bg-[var(--accent-bg)] text-[var(--accent-hi)] border border-[rgba(99,124,255,0.18)]",
  Technical:
    "bg-[var(--violet-bg)] text-[var(--violet)] border border-[rgba(164,124,255,0.18)]",
  Behavioral:
    "bg-[var(--teal-bg)] text-[var(--teal)] border border-[rgba(79,194,216,0.18)]",
  "Hiring Manager":
    "bg-[var(--accent-bg)] text-[var(--accent)] border border-[rgba(99,124,255,0.18)]",
  Panel:
    "bg-[var(--amber-bg)] text-[var(--amber)] border border-[rgba(229,162,59,0.18)]",
  "Final Round":
    "bg-[var(--rose-bg)] text-[var(--rose)] border border-[rgba(229,88,109,0.18)]",
  "Offer Discussion":
    "bg-[var(--emerald-bg)] text-[var(--emerald)] border border-[rgba(56,199,147,0.18)]",
};

export function InterviewTypeBadge({ type }: { type: InterviewType }) {
  return <Badge className={styles[type]}>{type}</Badge>;
}
