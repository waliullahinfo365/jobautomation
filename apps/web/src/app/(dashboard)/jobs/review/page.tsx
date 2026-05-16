import { Suspense } from "react";
import { ReviewPageClient } from "@/components/jobs/review/ReviewPageClient";

export const metadata = { title: "Quick Review — Job Automations" };

export default function JobReviewPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-[var(--text-3)]">Loading jobs…</div>}>
      <ReviewPageClient />
    </Suspense>
  );
}
