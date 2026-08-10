"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import type { TodayAction, TodaySummary } from "@/lib/api/today.api";
import { cn } from "@/lib/utils";
import { SimplePageShell } from "@/components/shared/SimplePageShell";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

import type { TodayDashboardProps } from "./AdvancedTodayDashboard";

function getGreeting(t: (key: string) => string): string {
  const h = new Date().getHours();
  if (h < 12) return t("today.simple.greetingMorning");
  if (h < 18) return t("today.simple.greetingAfternoon");
  return t("today.simple.greetingEvening");
}

function countFromAction(actions: TodayAction[] | undefined, type: string): number {
  const action = actions?.find((a) => a.type === type);
  if (!action) return 0;
  const match = action.title.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function pipelineCount(today: TodaySummary | null, stage: string): number {
  if (!today) return 0;
  const fromStages = today.pipelineStages.find((p) => p.status === stage)?.count;
  if (typeof fromStages === "number") return fromStages;
  const key = stage.toLowerCase() as keyof typeof today.pipeline;
  return Number(today.pipeline[key] ?? 0);
}

function SummaryCard({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[76px] flex-col justify-between rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-3.5 transition-colors hover:border-[var(--accent-ring)] hover:bg-[var(--surface-2)] sm:min-h-[88px] sm:p-4"
    >
      <span className="text-[11px] font-medium leading-snug text-[var(--text-3)] sm:text-[12px]">{label}</span>
      <span className="mt-2 text-[24px] font-bold leading-none tracking-[-0.03em] text-[var(--text-1)] sm:text-[28px]">
        {count}
      </span>
    </Link>
  );
}

export function SimpleTodayDashboard({ today }: Pick<TodayDashboardProps, "today">) {
  const { t } = useTranslation();
  const onboarding = useOnboardingStatus();

  const jobsToReview = today?.jobsToReviewToday ?? 0;
  const readyToApply = pipelineCount(today, "Ready");
  const followUps = countFromAction(today?.actions, "follow_up");
  const replies = countFromAction(today?.actions, "interviews") || pipelineCount(today, "Interview");

  const recentItems = useMemo(() => {
    const actions = today?.actions ?? [];
    return actions
      .filter((a) => ["review_jobs", "ready_to_apply", "follow_up"].includes(a.type))
      .slice(0, 3)
      .map((a) => ({ id: a.type, title: a.title, href: a.href }));
  }, [today?.actions]);

  const showRecent = recentItems.length > 0;

  const emailStep = onboarding.steps.find((s) => s.id === "email");
  const showEmailBanner = !onboarding.loading && emailStep && !emailStep.complete;

  const showStats =
    readyToApply > 0 || followUps > 0 || replies > 0 || jobsToReview > 0;

  return (
    <SimplePageShell className="space-y-6">
      <div className="space-y-2">
        <p className="text-[15px] font-medium text-[var(--text-3)]">{getGreeting(t)}</p>
        {jobsToReview > 0 ? (
          <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.03em] text-[var(--text-1)] sm:text-[32px]">
            {t("today.simple.headlineReview").replace("{{count}}", String(jobsToReview))}
          </h1>
        ) : (
          <div className="space-y-2">
            <h1 className="text-[26px] font-bold leading-[1.2] tracking-[-0.03em] text-[var(--text-1)] sm:text-[30px]">
              {t("today.simple.emptyHeadline")}
            </h1>
            <p className="text-[15px] leading-relaxed text-[var(--text-3)]">{t("today.simple.emptyBody")}</p>
          </div>
        )}
      </div>

      {showEmailBanner ? (
        <Link
          href="/settings?section=Integrations"
          className="flex min-h-[52px] items-center justify-between gap-3 rounded-2xl border border-[var(--amber-ring)] bg-[var(--amber-bg)] px-4 py-3 text-[14px] text-[var(--text-1)]"
        >
          <span>{t("today.simple.connectEmailBanner")}</span>
          <span className="shrink-0 font-semibold text-[var(--accent-hi)]">{t("today.simple.connectEmailCta")} →</span>
        </Link>
      ) : null}

      <OnboardingChecklist status={onboarding} />

      {showStats ? (
        <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          <SummaryCard label={t("today.simple.readyToApply")} count={readyToApply} href="/apply-assistant" />
          <SummaryCard label={t("today.simple.followUps")} count={followUps} href="/jobs?status=Applied" />
          <SummaryCard label={t("today.simple.replies")} count={replies} href="/jobs?status=Interview" />
        </section>
      ) : null}

      {!showStats ? (
        <p className="text-center text-[14px] leading-relaxed text-[var(--text-3)]">{t("today.simple.noActivityYet")}</p>
      ) : null}

      <section className="space-y-3">
        <Link
          href="/jobs/review"
          className={cn(
            "flex min-h-[52px] w-full items-center justify-center rounded-2xl px-5 text-[16px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(99,124,255,0.55)]",
            "bg-gradient-to-b from-[#7B8EFF] to-[#4D63E0] hover:from-[#8A9BFF] hover:to-[#5A72E8]"
          )}
        >
          {t("labels.reviewJobs")}
        </Link>
        <Link
          href="/apply-assistant"
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-5 text-[15px] font-semibold text-[var(--text-1)] transition-colors hover:bg-[var(--surface-2)]"
        >
          {t("labels.openApplyAssistant")}
        </Link>
      </section>

      {showRecent ? (
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold text-[var(--text-2)]">{t("today.simple.recentTitle")}</h2>
          <ul className="space-y-2">
            {recentItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl px-2 py-2 text-[14px] text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)]"
                >
                  <span className="min-w-0 truncate">{item.title}</span>
                  <span className="shrink-0 text-[var(--accent-hi)]">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </SimplePageShell>
  );
}
