"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getReviewQueue } from "@/lib/api/jobs.api";
import type { ReviewableJob, ReviewQueueResponse } from "@/types/job";
import { SwipeReviewSession } from "./SwipeReviewSession";

function EmptyQueue({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center px-4">
      <span className="text-5xl">✅</span>
      <div>
        <h2 className="text-xl font-bold text-[var(--text-1)]">All caught up!</h2>
        <p className="mt-1 text-sm text-[var(--text-3)]">
          No new jobs to review right now. Check back after your next job import.
        </p>
      </div>
      <button
        onClick={onBack}
        className="rounded-xl bg-[var(--surface-2)] px-5 py-2.5 text-sm font-semibold text-[var(--text-1)] hover:bg-[var(--border)] transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

export function ReviewPageClient() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ReviewableJob[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await getReviewQueue(50) as ReviewQueueResponse;
      setJobs(payload.jobs);
      setTotal(payload.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load review queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="mx-auto flex h-full max-w-md flex-col gap-4 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-1 text-xs text-[var(--text-3)] hover:text-[var(--text-2)] flex items-center gap-1"
          >
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Quick Review</h1>
        </div>
        {total > 0 && (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {total} to review
          </span>
        )}
      </div>

      {/* Swipe direction legend (desktop hint) */}
      <div className="hidden sm:grid grid-cols-4 gap-2 text-center">
        {[
          { dir: "← Swipe", label: "Reject", color: "text-red-500" },
          { dir: "↓ Swipe", label: "Later",  color: "text-amber-500" },
          { dir: "→ Swipe", label: "Save",   color: "text-green-500" },
          { dir: "↑ Swipe", label: "Apply",  color: "text-blue-600" },
        ].map(({ dir, label, color }) => (
          <div key={label} className="rounded-lg bg-[var(--surface-2)] px-2 py-1.5">
            <p className="text-[10px] text-[var(--text-3)]">{dir}</p>
            <p className={`text-xs font-semibold ${color}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {loading && (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-blue-500" />
            <p className="text-sm text-[var(--text-3)]">Loading your jobs…</p>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => void load()} className="text-xs text-blue-600 underline">Retry</button>
          </div>
        )}
        {!loading && !error && jobs !== null && (
          jobs.length === 0
            ? <EmptyQueue onBack={() => router.push("/dashboard")} />
            : <SwipeReviewSession initialJobs={jobs} total={total} />
        )}
      </div>
    </div>
  );
}
