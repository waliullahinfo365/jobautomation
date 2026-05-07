"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartDataPoint } from "@/types/report";

const TOOLTIP_CONTENT = {
  background: "var(--surface-2, #13171F)",
  border: "1px solid var(--border-default, rgba(255,255,255,0.07))",
  borderRadius: "var(--r-md, 10px)",
  color: "var(--text-1, #ECEEF2)",
} as const;

const SLICE_FILLS = [
  "var(--accent, #637CFF)",
  "var(--accent-lo, #4D63E0)",
  "var(--emerald, #38C793)",
  "var(--rose, #E5586D)",
  "var(--amber, #E5A23B)",
] as const;

export function StatusBreakdownChart({ data }: { data: ChartDataPoint[] }) {
  if (!data.length || data.every((d) => Number(d.value) <= 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
          <CardDescription>Pipeline status distribution from live applications (when available).</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-sm text-[var(--text-3)]">
          No status data yet — apply to roles this week to populate this chart.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Breakdown</CardTitle>
        <CardDescription>Current pipeline status distribution.</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" outerRadius={90}>
              {data.map((_, i) => (
                <Cell key={i} fill={SLICE_FILLS[i % SLICE_FILLS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_CONTENT}
              labelStyle={{ color: "var(--text-2, #B5BAC4)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}