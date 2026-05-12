"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/i18n/I18nProvider";

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

export function PipelineConversionChart({ data }: { data: { stage: string; conversion: number }[] }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("reports.chart.pipelineConversion")}</CardTitle>
        <CardDescription>{t("reports.chart.conversionByStage")}</CardDescription>
      </CardHeader>
      <CardContent className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              axisLine={false}
              tick={TICK}
            />
            <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} width={140} tick={TICK} />
            <Tooltip
              contentStyle={TOOLTIP_CONTENT}
              labelStyle={{ color: "var(--text-2, #B5BAC4)" }}
              formatter={(v) => [`${v}%`, "Conversion"]}
            />
            <Bar dataKey="conversion" radius={[0, 6, 6, 0]}>
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
