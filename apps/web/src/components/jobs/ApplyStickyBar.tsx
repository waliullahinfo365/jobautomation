"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { resolvePipelineStage, type PipelineStage } from "@/lib/jobs/pipeline-stage";
import type { Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STICKY_STAGES: PipelineStage[] = ["Ready", "Applied", "Interview", "Offer"];

export function shouldShowApplyStickyBar(job: Job): boolean {
  const stage = resolvePipelineStage(job);
  return STICKY_STAGES.includes(stage);
}

interface ApplyStickyBarProps {
  job: Job;
  onAutoApply?: () => void;
  autoApplyLoading?: boolean;
  autoApplyDisabled?: boolean;
}

export function ApplyStickyBar({ job, onAutoApply, autoApplyLoading, autoApplyDisabled }: ApplyStickyBarProps) {
  const { t } = useTranslation();
  const stage = resolvePipelineStage(job);
  const jobId = job.id ?? job._id ?? "";
  const showAutoApply = stage === "Ready" && onAutoApply;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-50 border-t border-[var(--border-default)] bg-[var(--surface-1)]/95 p-3 backdrop-blur-md",
        "mobile-sticky-above-nav md:left-[var(--sidebar-width,0px)]"
      )}
    >
      <div className="mx-auto flex max-w-lg gap-2">
        {showAutoApply ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="shrink-0 min-h-[44px]"
            disabled={autoApplyDisabled || autoApplyLoading}
            onClick={onAutoApply}
          >
            {autoApplyLoading ? t("applyAssistant.autoApplyLoading") : t("applyAssistant.autoApply")}
          </Button>
        ) : null}
        <Link
          href={`/jobs/${jobId}/apply`}
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[var(--accent-hi)] px-4 text-sm font-semibold text-white hover:brightness-110"
        >
          {t("applyAssistant.applyCta")}
        </Link>
      </div>
    </div>
  );
}
