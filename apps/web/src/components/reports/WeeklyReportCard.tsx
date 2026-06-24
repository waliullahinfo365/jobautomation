"use client";

import { BarChart3Icon } from "@/components/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeeklyPerformanceReport } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/i18n/I18nProvider";

interface WeeklyReportCardProps {
  report: WeeklyPerformanceReport;
}

export function WeeklyReportCard({ report }: WeeklyReportCardProps) {
  const { t, locale } = useTranslation();
  const fmtDate = (d: string | Date) =>
    new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    }).format(typeof d === "string" ? new Date(d) : d);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3Icon size={16} className="text-[var(--text-3)]" />
          <CardTitle className="text-sm">
            {t("reports.weeklyCard.title")} · {fmtDate(report.weekStart)} – {fmtDate(report.weekEnd)}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 sm:gap-3">
          {[
            { label: t("reports.weeklyCard.jobsAdded"), value: report.jobsAdded },
            { label: t("reports.weeklyCard.applications"), value: report.applicationsSubmitted },
            { label: t("reports.weeklyCard.interviews"), value: report.interviewsScheduled },
            { label: t("reports.weeklyCard.offers"), value: report.offersReceived },
            { label: t("reports.weeklyCard.rejections"), value: report.rejections },
            { label: t("reports.weeklyCard.responseRate"), value: `${report.responseRate}%` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
              <p className="text-xs text-[var(--text-3)]">{label}</p>
              <p className="text-lg font-bold text-[var(--text-1)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.statusBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
              <XAxis dataKey="status" tickLine={false} axisLine={false} stroke="var(--text-4)" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="var(--text-4)" />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--r-md)",
                }}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
