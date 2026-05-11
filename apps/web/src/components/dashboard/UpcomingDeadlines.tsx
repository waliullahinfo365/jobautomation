"use client";

import Link from "next/link";
import { ArrowRightIcon, DeadlineIcon } from "@/components/icons";
import type { JobSummary } from "@/types/job";
import { isOverdue } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import { formatDateLongLocale } from "@/lib/format-date-locale";

interface UpcomingDeadlinesProps {
  jobs: JobSummary[];
}

function getUrgencyKey(deadline: string | Date, now: Date): "today" | "tomorrow" | "thisWeek" | "later" {
  const d = new Date(deadline);
  const ms = d.getTime() - now.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 7) return "thisWeek";
  return "later";
}

function deadlineMonthDay(deadline: string | Date, locale: "de" | "en") {
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return { m: "—", d: "—" };
  const loc = locale === "de" ? "de-DE" : "en-US";
  const m = new Intl.DateTimeFormat(loc, { month: "short" }).format(d);
  const day = String(d.getDate()).padStart(2, "0");
  return { m, d: day };
}

export function UpcomingDeadlines({ jobs }: UpcomingDeadlinesProps) {
  const { t, locale } = useTranslation();
  const withDeadlines = jobs.filter((j) => j.deadline);
  const now = new Date();

  return (
    <article className="jf-panel flex min-h-[280px] min-w-0 flex-col sm:min-h-[320px]">
      <div className="jf-panel-head">
        <div className="jf-panel-title-wrap">
          <div className="jf-panel-title-icon">
            <DeadlineIcon size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="jf-panel-title">{t("dashboard.deadlines.title")}</h3>
            <p className="jf-panel-sub">{t("dashboard.deadlines.subtitle")}</p>
          </div>
        </div>
      </div>

      {withDeadlines.length === 0 ? (
        <div className="jf-empty mt-1 flex flex-1 flex-col justify-center">
          <div className="jf-empty-icon">
            <DeadlineIcon size={22} />
          </div>
          <div className="jf-empty-title">{t("dashboard.deadlines.emptyTitle")}</div>
          <p className="jf-empty-sub">{t("dashboard.deadlines.emptyBody")}</p>
          <Link href="/settings" className="jf-empty-cta">
            {t("dashboard.deadlines.configureReminders")}
            <ArrowRightIcon size={14} />
          </Link>
        </div>
      ) : (
        <div className="jf-deadlines">
          {withDeadlines.map((job) => {
            const overdue = job.deadline ? isOverdue(job.deadline) : false;
            const urgency = job.deadline ? getUrgencyKey(job.deadline, now) : "later";
            const parts = job.deadline ? deadlineMonthDay(job.deadline, locale) : { m: "—", d: "—" };

            const tagClass =
              overdue || urgency === "today"
                ? "jf-dl-tag--urgent"
                : urgency === "tomorrow" || urgency === "thisWeek"
                  ? "jf-dl-tag--soon"
                  : "jf-dl-tag--later";

            const tagLabel = overdue
              ? t("dashboard.deadlines.tagUrgent")
              : urgency === "today"
                ? t("dashboard.deadlines.urgencyToday")
                : urgency === "tomorrow" || urgency === "thisWeek"
                  ? t("dashboard.deadlines.tagSoon")
                  : t("dashboard.deadlines.tagOnTrack");

            const deadlineLine = job.deadline
              ? ` · ${formatDateLongLocale(job.deadline, locale)}`
              : "";
            const overdueSuffix = overdue ? ` · ${t("dashboard.deadlines.overdue")}` : "";

            return (
              <Link key={job._id} href={`/jobs/${job._id}`} className="jf-dl-row">
                <div className="jf-dl-date">
                  <span className="jf-dl-date-m">{parts.m}</span>
                  <span className="jf-dl-date-d">{parts.d}</span>
                </div>
                <div className="jf-dl-body">
                  <div className="jf-dl-title">{job.title}</div>
                  <div className="jf-dl-meta">
                    {job.company}
                    {deadlineLine}
                    {overdueSuffix}
                  </div>
                </div>
                <span className={cn("jf-dl-tag", tagClass)}>
                  {tagLabel}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </article>
  );
}
