"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { ReviewAction } from "@/types/job";

interface ActionStats {
  total: number;
  saved: number;
  applied: number;
  rejected: number;
  later: number;
}

interface Props {
  stats: ActionStats;
  onRestart?: () => void;
}

const StatRow = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
    <span className="text-sm text-[var(--text-2)]">{label}</span>
    <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
  </div>
);

export function ReviewSummary({ stats, onRestart }: Props) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 px-4 py-10 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <span className="text-4xl">🎯</span>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-[var(--text-1)]">You're done for today</h2>
        <p className="mt-1 text-sm text-[var(--text-3)]">We'll notify you when new matching jobs are found.</p>
      </div>

      <div className="w-full max-w-xs rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-1">
        <StatRow label="Jobs reviewed"     value={stats.total}    color="text-[var(--text-1)]" />
        <StatRow label="Saved"             value={stats.saved}    color="text-green-600 dark:text-green-400" />
        <StatRow label="Ready to apply"    value={stats.applied}  color="text-blue-600 dark:text-blue-400" />
        <StatRow label="Rejected"          value={stats.rejected} color="text-red-500" />
        <StatRow label="Review later"      value={stats.later}    color="text-amber-600 dark:text-amber-400" />
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {stats.saved > 0 && (
          <button
            onClick={() => router.push("/jobs?reviewStatus=saved")}
            className="w-full rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
          >
            View Saved Jobs ({stats.saved})
          </button>
        )}
        {stats.applied > 0 && (
          <button
            onClick={() => router.push("/jobs?reviewStatus=apply_next")}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Prepare Applications ({stats.applied})
          </button>
        )}
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-semibold text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-colors"
        >
          Go to Dashboard
        </button>
        {onRestart && (
          <button
            onClick={onRestart}
            className="text-xs text-[var(--text-3)] underline underline-offset-2 hover:text-[var(--text-2)]"
          >
            Review more jobs
          </button>
        )}
      </div>
    </motion.div>
  );
}
