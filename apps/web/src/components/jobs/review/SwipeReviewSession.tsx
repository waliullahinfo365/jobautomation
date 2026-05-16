"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ReviewableJob, ReviewAction, ReviewStatus } from "@/types/job";
import { reviewJob, undoReview } from "@/lib/api/jobs.api";
import { SwipeCard } from "./SwipeCard";
import { ReviewSummary } from "./ReviewSummary";
import { cn } from "@/lib/utils";
import { showError } from "@/lib/ui/toast";

// ── Action config ─────────────────────────────────────────────────────────────

const ACTION_TO_STATUS: Record<ReviewAction, ReviewStatus> = {
  reject: "rejected",
  save:   "saved",
  apply:  "apply_next",
  later:  "review_later",
};

const ACTION_LABELS: Record<ReviewAction, { text: string; icon: string; active: string; inactive: string }> = {
  reject: { text: "Reject", icon: "✕", active: "bg-red-500 text-white scale-110", inactive: "border border-[var(--border)] text-[var(--text-2)] hover:border-red-400 hover:text-red-500" },
  later:  { text: "Later",  icon: "↓", active: "bg-amber-500 text-white scale-110", inactive: "border border-[var(--border)] text-[var(--text-2)] hover:border-amber-400 hover:text-amber-500" },
  save:   { text: "Save",   icon: "♥", active: "bg-green-500 text-white scale-110", inactive: "border border-[var(--border)] text-[var(--text-2)] hover:border-green-400 hover:text-green-500" },
  apply:  { text: "Apply",  icon: "↑", active: "bg-blue-600 text-white scale-110", inactive: "border border-[var(--border)] text-[var(--text-2)] hover:border-blue-500 hover:text-blue-600" },
};

// ── Undo toast ────────────────────────────────────────────────────────────────

function UndoToast({ message, onUndo }: { message: string; onUndo: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[var(--text-1)] px-5 py-2.5 shadow-lg"
    >
      <span className="text-sm text-[var(--bg-1)] whitespace-nowrap">{message}</span>
      <button
        onClick={onUndo}
        className="text-sm font-semibold text-amber-400 hover:text-amber-300 whitespace-nowrap"
      >
        Undo
      </button>
    </motion.div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round(((current) / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-[var(--text-3)]">
        <span>{current} of {total} reviewed</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
        <motion.div
          className="h-full rounded-full bg-blue-500"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}

// ── Main session ──────────────────────────────────────────────────────────────

interface Props {
  initialJobs: ReviewableJob[];
  total: number;
}

interface HistoryEntry {
  jobId: string;
  action: ReviewAction;
  previousStatus: ReviewStatus;
}

export function SwipeReviewSession({ initialJobs, total }: Props) {
  const [queue, setQueue] = useState<ReviewableJob[]>(initialJobs);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [undoVisible, setUndoVisible] = useState(false);
  const [lastActionLabel, setLastActionLabel] = useState("");
  const [activeButton, setActiveButton] = useState<ReviewAction | null>(null);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ total: 0, saved: 0, applied: 0, rejected: 0, later: 0 });
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remainingJobs = queue.slice(currentIndex);
  const currentJob = remainingJobs[0];
  const nextJob = remainingJobs[1];

  const clearUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoVisible(false);
  }, []);

  const handleAction = useCallback(async (action: ReviewAction) => {
    if (!currentJob) return;
    const reviewStatus = ACTION_TO_STATUS[action];
    const previousStatus = (currentJob.reviewStatus as ReviewStatus) ?? "new";

    clearUndo();
    setActiveButton(action);
    setTimeout(() => setActiveButton(null), 600);

    const newStats = { ...stats, total: stats.total + 1 };
    if (action === "save")   newStats.saved++;
    if (action === "apply")  newStats.applied++;
    if (action === "reject") newStats.rejected++;
    if (action === "later")  newStats.later++;
    setStats(newStats);

    setHistory((h) => [...h, { jobId: currentJob.id, action, previousStatus }]);
    setLastActionLabel(`${currentJob.position} → ${ACTION_LABELS[action].text}`);

    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    if (nextIdx >= queue.length) setDone(true);

    // Show undo for 4s
    setUndoVisible(true);
    undoTimer.current = setTimeout(() => setUndoVisible(false), 4000);

    try {
      await reviewJob(currentJob.id, { reviewAction: action, reviewStatus });
    } catch {
      showError("Failed to save review — please try again");
    }
  }, [currentJob, currentIndex, queue.length, stats, clearUndo]);

  const handleUndo = useCallback(async () => {
    clearUndo();
    const last = history[history.length - 1];
    if (!last) return;

    setHistory((h) => h.slice(0, -1));
    setCurrentIndex((i) => Math.max(0, i - 1));
    setDone(false);

    const undoStats = { ...stats, total: Math.max(0, stats.total - 1) };
    const undoneAction = last.action;
    if (undoneAction === "save")   undoStats.saved   = Math.max(0, undoStats.saved - 1);
    if (undoneAction === "apply")  undoStats.applied  = Math.max(0, undoStats.applied - 1);
    if (undoneAction === "reject") undoStats.rejected = Math.max(0, undoStats.rejected - 1);
    if (undoneAction === "later")  undoStats.later    = Math.max(0, undoStats.later - 1);
    setStats(undoStats);

    try {
      await undoReview(last.jobId);
    } catch {
      showError("Undo failed — please try again");
    }
  }, [clearUndo, history, stats]);

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  if (done || !currentJob) {
    return <ReviewSummary stats={stats} onRestart={queue.length > currentIndex ? () => setDone(false) : undefined} />;
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <ProgressBar current={currentIndex} total={Math.max(queue.length, total)} />

      {/* Card stack */}
      <div className="relative flex-1 min-h-[420px]">
        <AnimatePresence>
          {nextJob && (
            <SwipeCard key={nextJob.id} job={nextJob} onAction={handleAction} isTop={false} stackIndex={1} />
          )}
          {remainingJobs[2] && (
            <SwipeCard key={remainingJobs[2].id} job={remainingJobs[2]} onAction={handleAction} isTop={false} stackIndex={2} />
          )}
          <SwipeCard key={currentJob.id} job={currentJob} onAction={handleAction} isTop stackIndex={0} />
        </AnimatePresence>
      </div>

      {/* Button fallback */}
      <div className="grid grid-cols-4 gap-2 pb-2">
        {(["reject", "later", "save", "apply"] as ReviewAction[]).map((action) => {
          const cfg = ACTION_LABELS[action];
          const isActive = activeButton === action;
          return (
            <button
              key={action}
              onClick={() => void handleAction(action)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-xs font-semibold transition-all duration-150",
                isActive ? cfg.active : cfg.inactive,
              )}
            >
              <span className="text-lg leading-none">{cfg.icon}</span>
              {cfg.text}
            </button>
          );
        })}
      </div>

      {/* Undo toast */}
      <AnimatePresence>
        {undoVisible && (
          <UndoToast message={lastActionLabel} onUndo={() => void handleUndo()} />
        )}
      </AnimatePresence>
    </div>
  );
}
