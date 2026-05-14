"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartDataPoint } from "@/types/report";
import { useTranslation } from "@/i18n/useTranslation";

const TOOLTIP_CONTENT = {
  background: "var(--surface-2, #13171F)",
  border: "1px solid var(--border-default, rgba(255,255,255,0.07))",
  borderRadius: "var(--r-md, 10px)",
  color: "var(--text-1, #ECEEF2)",
} as const;

const SLICE_FILLS = [
  "var(--accent, #637CFF)",
  "var(--emerald, #38C793)",
  "var(--amber, #E5A23B)",
  "var(--rose, #E5586D)",
  "var(--violet, #A47CFF)",
  "var(--accent-lo, #4D63E0)",
  "var(--cyan, #38BDF8)",
  "var(--teal, #2DD4BF)",
] as const;

export function StatusBreakdownChart({ data }: { data: ChartDataPoint[] }) {
  const { t } = useTranslation();

  const header = (
    <CardHeader>
      <CardTitle>{t("reports.statusBreakdown")}</CardTitle>
      <CardDescription>{t("reports.pipelineStatusDistribution")}</CardDescription>
    </CardHeader>
  );

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card>
        {header}
        <CardContent className="flex h-[300px] items-center justify-center text-sm text-[var(--text-3)]">
          {t("reports.noStatusDataYet")}
        </CardContent>
      </Card>
    );
  }

  // Single-item: a full-circle pie is meaningless. Render a simple metric bar list instead.
  if (data.length === 1) {
    const item = data[0];
    return (
      <Card>
        {header}
        <CardContent className="flex h-[300px] flex-col justify-center gap-4 px-6">
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ background: SLICE_FILLS[0] }}
              />
              <span className="text-sm font-medium text-[var(--text-1)]">{item.label}</span>
            </div>
            <span className="text-lg font-semibold text-[var(--text-1)]">{item.value}</span>
          </div>
          <p className="text-center text-xs text-[var(--text-3)]">
            {t("reports.chart.onlyOneStatusActive")}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Multi-item: pie chart with legend
  return (
    <Card>
      {header}
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              outerRadius={80}
              label={({ label, percent }) =>
                percent > 0.05 ? `${label} ${Math.round(percent * 100)}%` : ""
              }
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={SLICE_FILLS[i % SLICE_FILLS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_CONTENT}
              labelStyle={{ color: "var(--text-2, #B5BAC4)" }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: "var(--text-2, #B5BAC4)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
