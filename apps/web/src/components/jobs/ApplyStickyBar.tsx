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
        "fixed inset-x-0 z-50 border-t border-[var(--border-default)] bg-[var(--surface-1)]/95 p-3 backdrop-blur-md",
        "mobile-sticky-above-nav md:left-[var(--sidebar-width,0px)]"
      )}
    >
      <div className="mx-auto flex max-w-lg">
        <Link
          href={`/jobs/${jobId}/apply`}
          className="flex min-h-[44px] w-full flex-1 items-center justify-center rounded-xl bg-[var(--accent-hi)] px-4 text-sm font-semibold text-white hover:brightness-110"
        >
          {t("applyAssistant.applyCta")}
        </Link>
      </div>
    </div>
  );
}

export { shouldShowApplyStickyBar } from "./apply-sticky-bar-utils";
