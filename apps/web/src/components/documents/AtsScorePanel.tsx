"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { showError } from "@/lib/ui/toast";
import { cn } from "@/lib/utils";
import type { AtsBaseScoreResult } from "@/app/api/documents/ats-score/route";

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = size / 2 - 7;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={7} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize={16} fontWeight="700" fill={color}>
        {score}
      </text>
    </svg>
  );
}

// ── Category bar ──────────────────────────────────────────────────────────────

function CategoryBar({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--text-2)]">{label}</span>
        <span className="font-semibold text-[var(--text-1)]">{score}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  cvText: string;
  onImprovedContentReady?: (headline: string, summary: string) => void;
}

export function AtsScorePanel({ cvText, onImprovedContentReady }: Props) {
  const [result, setResult] = useState<AtsBaseScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"score" | "improvements" | "improved">("score");

  const handleScore = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AtsBaseScoreResult>("/documents/ats-score", {
        method: "POST",
        body: { cvText },
      });
      if (res) {
        setResult(res);
        onImprovedContentReady?.(res.improvedHeadline, res.improvedSummary);
      }
    } catch {
      showError("ATS scoring failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [cvText, onImprovedContentReady]);

  if (!result && !loading) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20 p-4 space-y-2">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Score this CV against ATS rules</p>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Claude will analyse your CV, score it across 5 ATS categories, flag critical issues, and rewrite the headline + summary to be ATS-optimised.
        </p>
        <Button size="sm" onClick={() => void handleScore()}>
          Run ATS Score
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent shrink-0" />
        <span className="text-sm text-[var(--text-2)]">Claude is scoring your CV… ~10 seconds</span>
      </div>
    );
  }

  const tabs = [
    { id: "score" as const, label: "Score" },
    { id: "improvements" as const, label: "Improvements" },
    { id: "improved" as const, label: "Improved Content" },
  ];

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-[var(--surface-2)] border-b border-[var(--border-default)]">
        {result && <ScoreRing score={result.overallScore} size={64} />}
        <div>
          <p className="text-sm font-bold text-[var(--text-1)]">ATS Score: {result?.overallScore}/100</p>
          <p className="text-xs text-[var(--text-3)]">
            {(result?.overallScore ?? 0) >= 75
              ? "Good ATS compatibility"
              : (result?.overallScore ?? 0) >= 50
              ? "Needs improvement"
              : "Critical issues found"}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void handleScore()} disabled={loading} className="ml-auto">
          Re-score
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-default)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 px-3 py-2 text-xs font-medium transition-colors",
              tab === t.id
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-[var(--text-3)] hover:text-[var(--text-2)]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {tab === "score" && result && (
          <>
            <div className="space-y-2.5">
              {Object.entries(result.categoryScores).map(([key, val]) => (
                <CategoryBar
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  score={val}
                />
              ))}
            </div>

            {result.strengths.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Strengths</p>
                {result.strengths.map((s, i) => (
                  <div key={i} className="flex gap-2 text-xs text-[var(--text-2)]">
                    <span className="text-green-500 shrink-0">✓</span>{s}
                  </div>
                ))}
              </div>
            )}

            {result.criticalIssues.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Critical Issues</p>
                {result.criticalIssues.map((s, i) => (
                  <div key={i} className="flex gap-2 text-xs text-red-600 dark:text-red-400">
                    <span className="shrink-0">✕</span>{s}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "improvements" && result && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-3)]">Apply these changes to your master CV to improve its ATS score:</p>
            {result.improvements.map((imp, i) => (
              <div key={i} className="flex gap-2.5 text-sm text-[var(--text-2)]">
                <span className="mt-0.5 text-blue-500 font-bold shrink-0">{i + 1}.</span>
                {imp}
              </div>
            ))}
          </div>
        )}

        {tab === "improved" && result && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-3)]">Use these as the base for your master CV — copy them in and re-upload:</p>
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">ATS-Optimised Headline</p>
              <p className="text-sm font-semibold text-[var(--text-1)]">{result.improvedHeadline}</p>
            </div>
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">ATS-Optimised Summary</p>
              <p className="text-sm text-[var(--text-2)] leading-relaxed">{result.improvedSummary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
