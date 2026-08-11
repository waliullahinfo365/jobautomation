"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import type { Job } from "@/types/job";
import { cn } from "@/lib/utils";

interface ApplyStickyBarProps {
  job: Job;
}

export function ApplyStickyBar({ job }: ApplyStickyBarProps) {
  const { t } = useTranslation();
  const jobId = job.id ?? job._id ?? "";

  return (
    <div
      className={cn(
        "fixed inset-x-0 border-t border-[var(--border-default)] bg-[var(--surface-1)]/95 p-3 backdrop-blur-md",
        "mobile-sticky-above-nav"
      )}
    >
      <div className="mx-auto flex w-full max-w-lg md:max-w-3xl lg:max-w-5xl">
        <Link
          href={`/jobs/${jobId}/apply`}
          className="flex min-h-[52px] w-full flex-1 items-center justify-center rounded-xl bg-[var(--accent-hi)] px-4 text-sm font-semibold text-white hover:brightness-110 md:min-h-[44px]"
        >
          {t("applyAssistant.applyCta")}
        </Link>
      </div>
    </div>
  );
}

export { shouldShowApplyStickyBar } from "./apply-sticky-bar-utils";
