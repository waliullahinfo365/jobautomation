"use client";

import Link from "next/link";
import { CheckIcon } from "@/components/icons/moreIcons";
import type { OnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

const STEP_LABEL_KEY: Record<OnboardingStatus["steps"][number]["id"], string> = {
  gmail: "onboarding.steps.connectGmail",
  resume: "onboarding.steps.uploadResume",
  coverTemplate: "onboarding.steps.uploadCoverTemplate",
  reviewJobs: "onboarding.steps.reviewJobs",
};

export function OnboardingChecklist({ status }: { status: OnboardingStatus }) {
  const { t } = useTranslation();

  if (status.loading || status.isComplete) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[var(--accent-ring)] bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-1)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-[var(--text-1)]">{t("onboarding.title")}</h2>
          <p className="mt-1 text-[13px] text-[var(--text-3)]">{t("onboarding.subtitle")}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--accent-bg)] px-2.5 py-1 text-[12px] font-semibold text-[var(--accent-hi)]">
          {status.completedCount}/{status.totalSteps}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {status.steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "flex min-h-[48px] items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                step.complete
                  ? "border-[var(--border-subtle)] bg-[var(--surface-1)]/60"
                  : "border-[var(--border-default)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  step.complete ? "bg-[var(--emerald-bg)] text-[var(--emerald)]" : "bg-[var(--surface-3)] text-[var(--text-4)]"
                )}
              >
                <CheckIcon size={14} className={step.complete ? "" : "opacity-30"} />
              </span>
              <span
                className={cn(
                  "text-[14px] font-medium",
                  step.complete ? "text-[var(--text-3)] line-through" : "text-[var(--text-1)]"
                )}
              >
                {t(STEP_LABEL_KEY[step.id])}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
