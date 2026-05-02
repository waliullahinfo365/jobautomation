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

/** Rotate fills: accent → accent-lo → emerald → violet (dark-theme fallbacks). */
const BAR_FILLS = [
  "var(--accent, #637CFF)",
  "var(--accent-lo, #4D63E0)",
  "var(--emerald, #38C793)",
  "var(--violet, #A47CFF)",
] as const;

export function ApplicationsBySourceChart({ data }: { data: { source: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications by Source</CardTitle>
        <CardDescription>Which channels drive most applications.</CardDescription>
      </CardHeader>
      <CardContent className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="source" tickLine={false} axisLine={false} tick={TICK} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={TICK} />
            <Tooltip
              contentStyle={TOOLTIP_CONTENT}
              labelStyle={{ color: "var(--text-2, #B5BAC4)" }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
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
