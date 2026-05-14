"use client";

import { useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PipelineIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";

interface PipelineDataPoint {
  status: string;
  count: number;
}

interface ApplicationPipelineChartProps {
  data: PipelineDataPoint[];
  loading?: boolean;
  error?: Error | null;
  isUsingFallback?: boolean;
}

const STAGE_KEY_MAP: Record<string, string> = {
  New: "new",
  Research: "research",
  Drafting: "drafting",
  "Ready to Apply": "readyToApply",
  Applied: "applied",
  Interview: "interview",
  Offer: "offer",
  Rejected: "rejected",
};

function useNarrowChart() {
  const query = "(max-width: 767px)";
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

export function ApplicationPipelineChart({ data, loading, error, isUsingFallback }: ApplicationPipelineChartProps) {
  const { t } = useTranslation();
  const narrow = useNarrowChart();
  const total = data.reduce((acc, item) => acc + item.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const applied = data.find((d) => d.status === "Applied")?.count ?? 0;
  const interview = data.find((d) => d.status === "Interview")?.count ?? 0;
  const conversionPct = applied > 0 ? Math.round((interview / applied) * 100) : interview > 0 ? 100 : 0;

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[Dashboard Pipeline]", { data, total, loading, error: error?.message, isUsingFallback });
  }

  const chartHeight = narrow ? 248 : 300;
  const chartMargins = narrow
    ? { top: 8, right: 2, left: -12, bottom: 8 }
    : { top: 10, right: 8, left: 4, bottom: 4 };

  function stageLabel(status: string): string {
    const key = STAGE_KEY_MAP[status];
    return key ? t(`dashboard.pipelineStages.${key}`) : status;
  }

  return (
    <article className="jf-panel min-w-0">
      <div className="jf-panel-head">
        <div className="jf-panel-title-wrap min-w-0">
          <div className="jf-panel-title-icon">
            <PipelineIcon size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="jf-panel-title">{t("dashboard.pipeline.title")}</h3>
            <p className="jf-panel-sub">{t("dashboard.pipeline.subtitle")}</p>
          </div>
        </div>
        <div className="jf-panel-tags">
          {loading ? (
            <span className="jf-tag animate-pulse">
              <span className="jf-tag-num">—</span> {t("dashboard.pipeline.tracked")}
            </span>
          ) : (
            <span className="jf-tag jf-tag--accent">
              <span className="jf-tag-num">{total}</span> {t("dashboard.pipeline.tracked")}
            </span>
          )}
          {!loading && !error && (
            <span className="jf-tag">
              {isUsingFallback ? (
                t("dashboard.pipeline.cached")
              ) : (
                <>
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[var(--accent-hi)] shadow-[0_0_8px_var(--accent-hi)]"
                    aria-hidden
                  />
                  {t("dashboard.pipeline.live")}
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex items-end gap-2 px-4" style={{ height: chartHeight }}>
          {[0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8, 0.2].map((h, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t-md bg-[var(--surface-4)]"
              style={{ height: `${h * 100}%` }}
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex items-center justify-center text-sm text-[var(--text-3)]" style={{ height: chartHeight }}>
          {t("dashboard.pipeline.errorLoading")}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && total === 0 && (
        <div className="flex flex-col items-center justify-center gap-1 text-sm text-[var(--text-3)]" style={{ height: chartHeight }}>
          <span>{t("dashboard.pipeline.noData")}</span>
        </div>
      )}

      {/* Chart */}
      <div
        className="w-full touch-pan-x"
        style={{ minHeight: narrow ? 220 : 280, display: loading || error ? "none" : undefined }}
      >
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data} margin={chartMargins}>
            <defs>
              <linearGradient id="jfPipeIndigo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C8FFF" />
                <stop offset="100%" stopColor="#4D63E0" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="jfPipeEmerald" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ADE9A" />
                <stop offset="100%" stopColor="#38C793" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border-subtle)"
            />
            <XAxis
              dataKey="status"
              interval={0}
              height={narrow ? 56 : 36}
              tickFormatter={(v: string) => stageLabel(v)}
              tick={{
                fontSize: narrow ? 9 : 11,
                fill: "var(--text-2)",
                fontFamily: "var(--font-ui), ui-sans-serif, system-ui, sans-serif",
                ...(narrow
                  ? { angle: -42, textAnchor: "end" as const, dy: 6 }
                  : {}),
              }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              width={narrow ? 28 : 36}
              tick={{
                fontSize: 10.5,
                fill: "var(--text-4)",
                fontFamily: "var(--font-mono), ui-monospace, monospace",
              }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "var(--accent-bg)" }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid var(--border-default)",
                background: "var(--surface-2)",
                color: "var(--text-1)",
                fontSize: "12px",
                boxShadow: "0 12px 24px rgba(0,0,0,0.35)",
              }}
              labelStyle={{ color: "var(--text-2)" }}
              labelFormatter={(v: string) => stageLabel(v)}
            />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              maxBarSize={narrow ? 22 : 34}
              animationDuration={700}
            >
              {data.map((entry) => {
                const isOffer = entry.status === "Offer";
                const opacity = isOffer
                  ? 0.95
                  : Math.min(0.95, 0.28 + (entry.count / maxCount) * 0.67);
                return (
                  <Cell
                    key={entry.status}
                    fill={isOffer ? "url(#jfPipeEmerald)" : "url(#jfPipeIndigo)"}
                    fillOpacity={opacity}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="jf-pipe-foot">
        <div>
          <div className="jf-pipe-stat-label">{t("dashboard.pipeline.conversion")}</div>
          <div className="jf-pipe-stat-val">
            {loading ? "—" : `${conversionPct}%`}
            <small>{t("dashboard.pipeline.appliedToInterview")}</small>
          </div>
        </div>
        <div>
          <div className="jf-pipe-stat-label">{t("dashboard.pipeline.totalJobs")}</div>
          <div className="jf-pipe-stat-val">
            {loading ? "—" : total}
            <small>{t("dashboard.pipeline.tracked")}</small>
          </div>
        </div>
        <div>
          <div className="jf-pipe-stat-label">{t("dashboard.pipeline.synced")}</div>
          <div className="jf-pipe-stat-val">
            {loading ? "—" : isUsingFallback ? t("dashboard.pipeline.cached") : t("dashboard.pipeline.live")}
            <small>{t("dashboard.pipeline.fromPipeline")}</small>
          </div>
        </div>
      </div>
    </article>
  );
}
