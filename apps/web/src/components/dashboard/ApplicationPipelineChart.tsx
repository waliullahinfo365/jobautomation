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

export function ApplicationPipelineChart({ data }: ApplicationPipelineChartProps) {
  const { t } = useTranslation();
  const narrow = useNarrowChart();
  const total = data.reduce((acc, item) => acc + item.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const applied = data.find((d) => d.status === "Applied")?.count ?? 0;
  const interview = data.find((d) => d.status === "Interview")?.count ?? 0;
  const conversionPct = applied > 0 ? Math.round((interview / applied) * 100) : interview > 0 ? 100 : 0;

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
          <span className="jf-tag jf-tag--accent">
            <span className="jf-tag-num">{total}</span> {t("dashboard.pipeline.tracked")}
          </span>
          <span className="jf-tag">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[var(--accent-hi)] shadow-[0_0_8px_var(--accent-hi)]"
              aria-hidden
            />
            {t("dashboard.pipeline.live")}
          </span>
        </div>
      </div>

      <div
        className="w-full touch-pan-x"
        style={{ minHeight: narrow ? 220 : 280 }}
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
            {conversionPct}%
            <small>{t("dashboard.pipeline.appliedToInterview")}</small>
          </div>
        </div>
        <div>
          <div className="jf-pipe-stat-label">{t("dashboard.pipeline.avgVelocity")}</div>
          <div className="jf-pipe-stat-val">
            3.2d
            <small>{t("dashboard.pipeline.stageToStage")}</small>
          </div>
        </div>
        <div>
          <div className="jf-pipe-stat-label">{t("dashboard.pipeline.synced")}</div>
          <div className="jf-pipe-stat-val">
            {t("dashboard.pipeline.live")}
            <small>{t("dashboard.pipeline.fromPipeline")}</small>
          </div>
        </div>
      </div>
    </article>
  );
}
