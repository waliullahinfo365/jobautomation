"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import type { ReviewableJob, ReviewAction } from "@/types/job";
import { cn } from "@/lib/utils";
import { analyzeJobForReview } from "@/lib/api/jobs.api";
import type { JobReviewAi } from "@/types/job";

// ── Constants ─────────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 110;
const SWIPE_VELOCITY_THRESHOLD = 500;

const ACTION_CONFIG: Record<ReviewAction, { label: string; color: string; border: string; bg: string }> = {
  reject: { label: "Reject", color: "text-red-500", border: "border-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
  save:   { label: "Save",   color: "text-green-500", border: "border-green-400", bg: "bg-green-50 dark:bg-green-950/30" },
  apply:  { label: "Apply",  color: "text-blue-500", border: "border-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
  later:  { label: "Later",  color: "text-amber-500", border: "border-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
};

const EFFORT_COLORS = {
  Low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

// ── SwipeIndicator overlay ────────────────────────────────────────────────────

function SwipeIndicator({ action, opacity }: { action: ReviewAction; opacity: ReturnType<typeof useMotionValue<number>> }) {
  const cfg = ACTION_CONFIG[action];
  return (
    <motion.div
      style={{ opacity }}
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-4",
        cfg.border, cfg.bg,
      )}
    >
      <span className={cn("text-4xl font-black tracking-widest uppercase", cfg.color)}>
        {cfg.label}
      </span>
    </motion.div>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "text-green-500" : score >= 50 ? "text-amber-500" : "text-red-500";
  const ring = score >= 75 ? "stroke-green-500" : score >= 50 ? "stroke-amber-500" : "stroke-red-500";
  const circumference = 2 * Math.PI * 20;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative flex h-14 w-14 items-center justify-center shrink-0">
      <svg className="-rotate-90" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-[var(--border-default)]" />
        <circle
          cx="28" cy="28" r="20" fill="none" strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className={ring}
        />
      </svg>
      <span className={cn("absolute text-xs font-bold", color)}>{score}%</span>
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

interface Props {
  job: ReviewableJob;
  onAction: (action: ReviewAction) => void;
  isTop: boolean;
  stackIndex: number;
}

export function SwipeCard({ job, onAction, isTop, stackIndex }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);

  const rejectOpacity  = useTransform(x, [0, -SWIPE_THRESHOLD], [0, 1]);
  const saveOpacity    = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const applyOpacity   = useTransform(y, [0, -SWIPE_THRESHOLD], [0, 1]);
  const laterOpacity   = useTransform(y, [0, SWIPE_THRESHOLD], [0, 1]);

  const [ai, setAi] = useState<JobReviewAi | null>(
    job.reviewAiScore != null
      ? {
          score: job.reviewAiScore,
          reasons: job.reviewAiReasons ?? [],
          redFlags: job.reviewAiRedFlags ?? [],
          effort: job.reviewAiEffort ?? "Medium",
          recommendation: job.reviewAiRecommendation ?? "",
        }
      : null
  );
  const [aiLoading, setAiLoading] = useState(false);
  const analyzed = useRef(false);

  useEffect(() => {
    if (!isTop || analyzed.current || ai) return;
    analyzed.current = true;
    setAiLoading(true);
    analyzeJobForReview(job.id)
      .then(setAi)
      .catch(() => null)
      .finally(() => setAiLoading(false));
  }, [isTop, ai, job.id]);

  function flyOut(direction: "left" | "right" | "up" | "down", action: ReviewAction) {
    const targetX = direction === "left" ? -800 : direction === "right" ? 800 : 0;
    const targetY = direction === "up" ? -800 : direction === "down" ? 800 : 0;
    void animate(x, targetX, { duration: 0.3 });
    void animate(y, targetY, { duration: 0.3 });
    setTimeout(() => onAction(action), 280);
  }

  function handleDragEnd(_: unknown, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) {
    const ox = x.get() || info.offset.x;
    const oy = y.get() || info.offset.y;
    const vx = Math.abs(info.velocity.x);
    const vy = Math.abs(info.velocity.y);
    const passedX = Math.abs(ox) > SWIPE_THRESHOLD || vx > SWIPE_VELOCITY_THRESHOLD;
    const passedY = Math.abs(oy) > SWIPE_THRESHOLD || vy > SWIPE_VELOCITY_THRESHOLD;

    if (passedX && Math.abs(ox) >= Math.abs(oy)) {
      ox < 0 ? flyOut("left", "reject") : flyOut("right", "save");
    } else if (passedY) {
      oy < 0 ? flyOut("up", "apply") : flyOut("down", "later");
    } else {
      // snap back
      void animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
      void animate(y, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  }

  const deadline = job.deadline ? new Date(job.deadline) : null;
  const daysUntilDeadline = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null;
  const isUrgent = daysUntilDeadline != null && daysUntilDeadline <= 7 && daysUntilDeadline >= 0;

  if (!isTop) {
    const scale = 1 - stackIndex * 0.04;
    const translateY = stackIndex * 10;
    return (
      <div
        className="absolute inset-x-0 top-0 h-full rounded-2xl bg-[var(--surface-1)] border border-[var(--border-default)] shadow-sm"
        style={{ transform: `scale(${scale}) translateY(${translateY}px)`, transformOrigin: "top center", zIndex: 10 - stackIndex }}
      />
    );
  }

  return (
    <motion.div
      className="absolute inset-x-0 top-0 z-20 cursor-grab active:cursor-grabbing touch-none select-none"
      style={{ x, y, rotate }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.02 }}
    >
      {/* Swipe overlays */}
      <SwipeIndicator action="reject" opacity={rejectOpacity} />
      <SwipeIndicator action="save"   opacity={saveOpacity} />
      <SwipeIndicator action="apply"  opacity={applyOpacity} />
      <SwipeIndicator action="later"  opacity={laterOpacity} />

      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border-default)] shadow-xl overflow-hidden">
        {/* Header strip */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-[var(--text-1)] leading-snug line-clamp-2">{job.position}</h2>
              <p className="mt-0.5 text-sm font-medium text-[var(--text-2)]">{job.company}</p>
            </div>
            {ai?.score != null && <ScoreRing score={ai.score} />}
            {aiLoading && (
              <div className="h-14 w-14 shrink-0 rounded-full border-2 border-[var(--border-default)] flex items-center justify-center">
                <span className="text-[10px] text-[var(--text-3)] animate-pulse">AI…</span>
              </div>
            )}
          </div>

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.location && (
              <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-xs text-[var(--text-2)]">
                {job.location}
              </span>
            )}
            {job.source && (
              <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-xs text-[var(--text-2)]">
                {job.source}
              </span>
            )}
            {job.salaryRange && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                {job.salaryRange}
              </span>
            )}
            {isUrgent && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                Deadline in {daysUntilDeadline}d
              </span>
            )}
            {ai?.effort && (
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", EFFORT_COLORS[ai.effort])}>
                {ai.effort} effort
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--border-default)]" />

        {/* AI insights */}
        <div className="px-5 py-4 space-y-3 max-h-[40vh] overflow-hidden">
          {ai ? (
            <>
              {ai.reasons.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Why it fits</p>
                  <ul className="space-y-1">
                    {ai.reasons.map((r, i) => (
                      <li key={i} className="flex gap-2 text-sm text-[var(--text-2)]">
                        <span className="mt-0.5 text-green-500 shrink-0">✓</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ai.redFlags.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Red flags</p>
                  <ul className="space-y-1">
                    {ai.redFlags.map((f, i) => (
                      <li key={i} className="flex gap-2 text-sm text-amber-700 dark:text-amber-400">
                        <span className="shrink-0">⚠</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ai.recommendation && (
                <p className="text-xs italic text-[var(--text-3)]">AI: {ai.recommendation}</p>
              )}
            </>
          ) : aiLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 w-2/3 rounded bg-[var(--surface-2)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--surface-2)]" />
              <div className="h-3 w-3/4 rounded bg-[var(--surface-2)]" />
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Job summary</p>
              <p className="text-sm text-[var(--text-2)] line-clamp-5">{job.description || job.aiSummary || "No description available."}</p>
            </div>
          )}
        </div>

        {/* Swipe hint */}
        <div className="border-t border-[var(--border-default)] bg-[var(--surface-2)] px-5 py-2.5">
          <p className="text-center text-[10px] text-[var(--text-3)] tracking-wide">
            ← Reject &nbsp;·&nbsp; Save → &nbsp;·&nbsp; ↑ Apply &nbsp;·&nbsp; ↓ Later
          </p>
        </div>
      </div>
    </motion.div>
  );
}
