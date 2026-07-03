"use client";

import Link from "next/link";
import { useMemo } from "react";
import { SimplePageHeader } from "@/components/shared/SimplePageHeader";
import { SimplePageShell } from "@/components/shared/SimplePageShell";
import { CustomerListPageSkeleton } from "@/components/shared/CustomerPageSkeletons";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { normalizeJobForUi } from "@/lib/utils/resource";
import { useTranslation } from "@/i18n/useTranslation";
import type { Job } from "@/types/job";

const APPLY_READY_STATUSES = new Set(["Saved", "Drafting", "Ready"]);

export function ApplyAssistantPageClient() {
  const { t } = useTranslation();
  const jobsApi = useJobsApi({ fallbackToMock: false });

  const readyJobs = useMemo(() => {
    const rows = normalizeListResponse<unknown>(jobsApi.list).map((row) => normalizeJobForUi(row));
    return rows.filter((job) => APPLY_READY_STATUSES.has(job.status));
  }, [jobsApi.list]);

  if (jobsApi.loading && !jobsApi.list) {
    return <CustomerListPageSkeleton withTabs={false} />;
  }

  if (jobsApi.error && !jobsApi.list) {
    return (
      <SimplePageShell>
        <SimplePageHeader title={t("applyHub.title")} description={t("applyHub.description")} />
        <ErrorState
          title={t("applyHub.loadingTitle")}
          description={jobsApi.error.message}
          actionLabel={t("common.retry")}
          onAction={() => void jobsApi.refetch()}
        />
      </SimplePageShell>
    );
  }

  return (
    <SimplePageShell>
      <SimplePageHeader title={t("applyHub.title")} description={t("applyHub.description")} />

      {readyJobs.length === 0 ? (
        <EmptyState
          title={t("applyHub.emptyTitle")}
          description={t("applyHub.empty")}
          cta={{ label: t("applyHub.browseInbox"), href: "/jobs" }}
          compact
        />
      ) : (
        <ul className="space-y-2">
          {readyJobs.map((job: Job) => (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.id}/apply`}
                className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3 transition-colors hover:bg-[var(--surface-2)]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--text-1)]">{job.position || job.title}</p>
                  <p className="truncate text-sm text-[var(--text-3)]">{job.company}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--accent-hi)]">
                  {t("applyHub.startApply")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SimplePageShell>
  );
}
