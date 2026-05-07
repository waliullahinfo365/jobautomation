"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TOOLTIP_CONTENT = {
  background: "var(--surface-2, #13171F)",
  border: "1px solid var(--border-default, rgba(255,255,255,0.07))",
  borderRadius: "var(--r-md, 10px)",
  color: "var(--text-1, #ECEEF2)",
} as const;

const GRID_STROKE = "var(--border-subtle, rgba(255,255,255,0.045))";

const TICK = { fill: "var(--text-3, #7C828F)", fontSize: 11 } as const;

const BAR_FILLS = [
  "var(--accent, #637CFF)",
  "var(--accent-lo, #4D63E0)",
  "var(--emerald, #38C793)",
  "var(--violet, #A47CFF)",
] as const;

export function WeeklyApplicationTrendChart({ data }: { data: { day: string; applications: number }[] }) {
  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Application Trend</CardTitle>
          <CardDescription>Applications submitted by day in current week.</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-sm text-[var(--text-3)]">
          No applications logged this week yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Application Trend</CardTitle>
        <CardDescription>Applications submitted by day in current week.</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={TICK} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={TICK} />
            <Tooltip
              contentStyle={TOOLTIP_CONTENT}
              labelStyle={{ color: "var(--text-2, #B5BAC4)" }}
            />
            <Bar dataKey="applications" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={BAR_FILLS[i % BAR_FILLS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}