"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import type { ReviewableJob, ReviewAction } from "@/types/job";
import { cn } from "@/lib/utils";
import { analyzeJobForReview } from "@/lib/api/jobs.api";
import type { JobReviewAi } from "@/types/job";
import { TailoredCvModal } from "@/components/jobs/TailoredCvModal";

// ── Constants ─────────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 60;
const SWIPE_VELOCITY_THRESHOLD = 250;

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

// ── Full details bottom sheet ─────────────────────────────────────────────────

function DetailsSheet({ job, ai, onClose, onTailorCv }: { job: ReviewableJob; ai: JobReviewAi | null; onClose: () => void; onTailorCv: () => void }) {
  return (
    <>
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        key="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-[var(--surface-1)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[var(--border-default)]" />
        </div>

        <div className="px-5 pb-10 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-1)] leading-snug">{job.position}</h2>
              <p className="text-sm text-[var(--text-2)]">{job.company}</p>
            </div>
            {ai?.score != null && <ScoreRing score={ai.score} />}
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-1.5">
            {job.location && <Chip>{job.location}</Chip>}
            {job.source && <Chip>{job.source}</Chip>}
            {job.salaryRange && <Chip className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{job.salaryRange}</Chip>}
            {ai?.effort && <Chip className={EFFORT_COLORS[ai.effort]}>{ai.effort} effort</Chip>}
            {job.remote && <Chip className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Remote</Chip>}
          </div>

          {/* Why it fits */}
          {ai && ai.reasons.length > 0 && (
            <Section title="Why it fits">
              <ul className="space-y-1.5">
                {ai.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[var(--text-2)]">
                    <span className="mt-0.5 text-green-500 shrink-0">✓</span>
                    {r}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Red flags */}
          {ai && ai.redFlags.length > 0 && (
            <Section title="Red flags">
              <ul className="space-y-1.5">
                {ai.redFlags.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <span className="shrink-0">⚠</span>
                    {f}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* AI recommendation */}
          {ai?.recommendation && (
            <Section title="AI recommendation">
              <p className="text-sm text-[var(--text-2)]">{ai.recommendation}</p>
            </Section>
          )}

          {/* Job description */}
          {(job.description || job.aiSummary) && (
            <Section title="Job description">
              <p className="text-sm text-[var(--text-2)] whitespace-pre-wrap leading-relaxed">
                {job.description || job.aiSummary}
              </p>
            </Section>
          )}

          {/* Contact / apply */}
          {(job.contactEmail || job.jobUrl) && (
            <Section title="Apply / contact">
              {job.jobUrl && (
                <a
                  href={job.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 underline break-all"
                >
                  View original posting ↗
                </a>
              )}
              {job.contactEmail && (
                <a href={`mailto:${job.contactEmail}`} className="block text-sm text-blue-600 underline">
                  {job.contactEmail}
                </a>
              )}
            </Section>
          )}

          {/* Tailor CV button */}
          <button
            onClick={onTailorCv}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            ✦ Tailor CV for this job
          </button>

          <button
            onClick={onClose}
            className="w-full rounded-xl bg-[var(--surface-2)] py-3 text-sm font-semibold text-[var(--text-2)] hover:bg-[var(--border)] transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">{title}</p>
      {children}
    </div>
  );
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs", className ?? "bg-[var(--surface-2)] text-[var(--text-2)]")}>
      {children}
    </span>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

interface Props {
  job: ReviewableJob;
  onAction: (action: ReviewAction) => void;
  isTop: boolean;
  stackIndex: number;
  prefetchedAi?: JobReviewAi | null;
}

export function SwipeCard({ job, onAction, isTop, stackIndex, prefetchedAi }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);

  const rejectOpacity  = useTransform(x, [0, -SWIPE_THRESHOLD], [0, 1]);
  const saveOpacity    = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const applyOpacity   = useTransform(y, [0, -SWIPE_THRESHOLD], [0, 1]);
  const laterOpacity   = useTransform(y, [0, SWIPE_THRESHOLD], [0, 1]);

  const seedAi = prefetchedAi ?? (job.reviewAiScore != null
    ? {
        score: job.reviewAiScore,
        reasons: job.reviewAiReasons ?? [],
        redFlags: job.reviewAiRedFlags ?? [],
        effort: job.reviewAiEffort ?? "Medium",
        recommendation: job.reviewAiRecommendation ?? "",
      }
    : null);

  const [ai, setAi] = useState<JobReviewAi | null>(seedAi);
  const [aiLoading, setAiLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [tailorOpen, setTailorOpen] = useState(false);
  const analyzed = useRef(false);

  // Sync if prefetchedAi arrives after initial render
  useEffect(() => {
    if (prefetchedAi && !ai) setAi(prefetchedAi);
  }, [prefetchedAi, ai]);

  // Fallback: fetch on-demand only if prefetch didn't deliver and this is the top card
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
    const targetX = direction === "left" ? -600 : direction === "right" ? 600 : 0;
    const targetY = direction === "up" ? -600 : direction === "down" ? 600 : 0;
    void animate(x, targetX, { duration: 0.18 });
    void animate(y, targetY, { duration: 0.18 });
    setTimeout(() => onAction(action), 160);
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
      void animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
      void animate(y, 0, { type: "spring", stiffness: 500, damping: 30 });
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
    <>
      <motion.div
        className="absolute inset-x-0 top-0 z-20 cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ x, y, rotate }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 1.02 }}
      >
        {/* Swipe overlays */}
        <SwipeIndicator action="reject" opacity={rejectOpacity} />
        <SwipeIndicator action="save"   opacity={saveOpacity} />
        <SwipeIndicator action="apply"  opacity={applyOpacity} />
        <SwipeIndicator action="later"  opacity={laterOpacity} />

        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border-default)] shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-3">
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

          {/* AI insights — compact preview */}
          <div className="px-4 py-3 space-y-2 overflow-hidden" style={{ maxHeight: "28vh" }}>
            {ai ? (
              <>
                {ai.reasons.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Why it fits</p>
                    <ul className="space-y-1">
                      {ai.reasons.slice(0, 3).map((r, i) => (
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
                      {ai.redFlags.slice(0, 2).map((f, i) => (
                        <li key={i} className="flex gap-2 text-sm text-amber-700 dark:text-amber-400">
                          <span className="shrink-0">⚠</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
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
                <p className="text-sm text-[var(--text-2)] line-clamp-4">{job.description || job.aiSummary || "No description available."}</p>
              </div>
            )}
          </div>

          {/* Footer: see more + swipe hint */}
          <div className="border-t border-[var(--border-default)] bg-[var(--surface-2)] px-4 py-2 flex items-center justify-between">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setShowDetails(true); }}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              See full details ↗
            </button>
            <p className="text-[10px] text-[var(--text-3)] tracking-wide">
              ← Reject · Save → · ↑ Apply · ↓ Later
            </p>
          </div>
        </div>
      </motion.div>

      {showDetails && (
        <DetailsSheet
          job={job}
          ai={ai}
          onClose={() => setShowDetails(false)}
          onTailorCv={() => { setShowDetails(false); setTailorOpen(true); }}
        />
      )}

      {tailorOpen && (
        <TailoredCvModal
          jobId={job.id}
          jobTitle={job.position}
          company={job.company}
          isOpen={tailorOpen}
          onClose={() => setTailorOpen(false)}
        />
      )}
    </>
  );
}
