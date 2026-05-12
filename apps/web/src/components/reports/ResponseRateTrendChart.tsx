"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/i18n/useTranslation";

const TOOLTIP_CONTENT = {
  background: "var(--surface-2, #13171F)",
  border: "1px solid var(--border-default, rgba(255,255,255,0.07))",
  borderRadius: "var(--r-md, 10px)",
  color: "var(--text-1, #ECEEF2)",
} as const;

const GRID_STROKE = "var(--border-subtle, rgba(255,255,255,0.045))";

const TICK = { fill: "var(--text-3, #7C828F)", fontSize: 11 } as const;

const LINE_STROKE = "var(--accent-hi, #8499FF)";

const DOT = {
  r: 4,
  fill: "var(--accent, #637CFF)",
  stroke: "var(--text-1, #ECEEF2)",
  strokeWidth: 1.5,
} as const;

const ACTIVE_DOT = { r: 5, fill: "var(--accent-hi, #8499FF)", stroke: "var(--text-1, #ECEEF2)" } as const;

export function ResponseRateTrendChart({ data }: { data: { day: string; rate: number }[] }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("reports.responseRateTrend")}</CardTitle>
        <CardDescription>{t("reports.chart.dailyResponseRateMovement")}</CardDescription>
      </CardHeader>
      <CardContent className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={TICK} />
            <YAxis tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={TICK} />
            <Tooltip
              contentStyle={TOOLTIP_CONTENT}
              labelStyle={{ color: "var(--text-2, #B5BAC4)" }}
              formatter={(v) => [`${v}%`, "Rate"]}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke={LINE_STROKE}
              strokeWidth={2.5}
              dot={DOT}
              activeDot={ACTIVE_DOT}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
