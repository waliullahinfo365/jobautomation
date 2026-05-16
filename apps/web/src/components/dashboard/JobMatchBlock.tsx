"use client";

import { useRouter } from "next/navigation";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { getReviewQueue } from "@/lib/api/jobs.api";
import type { ReviewQueueResponse } from "@/types/job";

export function JobMatchBlock() {
  const router = useRouter();
  const { data, loading } = useApiQuery(() => getReviewQueue(1), { enabled: true });
  const payload = data as ReviewQueueResponse | undefined;
  const total = payload?.total ?? 0;
  const urgent = payload?.urgentCount ?? 0;
  const deadlineSoon = payload?.deadlineSoonCount ?? 0;

  if (loading && !payload) return null;
  if (total === 0) return null;

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:border-blue-900/40 dark:from-blue-950/20 dark:to-indigo-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <h3 className="text-base font-bold text-[var(--text-1)]">Today&rsquo;s Job Matches</h3>
          </div>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            <span className="font-semibold text-[var(--text-1)]">{total}</span> new job{total !== 1 ? "s" : ""} waiting for review
            {urgent > 0 && (
              <> &nbsp;·&nbsp; <span className="font-semibold text-amber-600 dark:text-amber-400">{urgent} high-priority</span></>
            )}
            {deadlineSoon > 0 && (
              <> &nbsp;·&nbsp; <span className="font-semibold text-red-600 dark:text-red-400">{deadlineSoon} with urgent deadlines</span></>
            )}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-3)]">
            Review job matches in seconds — swipe to reject, save, or prepare your application.
          </p>
        </div>
        <button
          onClick={() => router.push("/jobs/review")}
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Start Quick Review
        </button>
      </div>
    </div>
  );
}
