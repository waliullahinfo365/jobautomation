import { NewspaperIcon } from "@/components/icons";
import type { DailyDigestReport } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/i18n/I18nProvider";

interface DailyDigestCardProps {
  report: DailyDigestReport;
}

export function DailyDigestCard({ report }: DailyDigestCardProps) {
  const { t, locale } = useTranslation();
  const fmtDate = (d: string | Date) =>
    new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    }).format(typeof d === "string" ? new Date(d) : d);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <NewspaperIcon size={16} className="text-[var(--text-3)]" />
          <CardTitle className="text-sm">{t("reports.digestCard.title")} · {fmtDate(report.date)}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          {[
            { label: t("reports.digestCard.totalJobs"), value: report.totalJobs },
            { label: t("reports.digestCard.active"), value: report.activeJobs },
            { label: t("reports.digestCard.appliedToday"), value: report.appliedToday },
            { label: t("reports.digestCard.pendingFollowUps"), value: report.pendingFollowUps },
            { label: t("reports.digestCard.overdueDeadlines"), value: report.overdueDeadlines },
            { label: t("reports.digestCard.automationErrors"), value: report.automationErrors },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
              <p className="text-xs text-[var(--text-3)]">{label}</p>
              <p className="text-lg font-bold text-[var(--text-1)]">{value}</p>
            </div>
          ))}
        </div>

        {report.highlights.length > 0 && (
          <ul className="space-y-1">
            {report.highlights.map((h, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-[var(--text-3)]">
                <span className="text-[var(--accent)]">•</span>
                {h}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
