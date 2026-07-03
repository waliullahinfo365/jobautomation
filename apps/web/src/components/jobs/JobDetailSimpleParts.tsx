"use client";

import Link from "next/link";
import type { Job } from "@/types/job";
import { SectionCard } from "@/components/shared/SectionCard";
import { useTranslation } from "@/i18n/useTranslation";
import { jobSourceDisplayLabel } from "@/i18n/job-filters";
import { JobStatusBadge } from "./JobStatusBadge";
import { MapPinIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

function ReadinessRow({ label, ready, readyLabel, notReadyLabel }: { label: string; ready: boolean; readyLabel: string; notReadyLabel: string }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2.5">
      <span className="text-[14px] text-[var(--text-2)]">{label}</span>
      <span
        className={cn(
          "text-[12px] font-semibold",
          ready ? "text-[var(--emerald)]" : "text-[var(--text-4)]"
        )}
      >
        {ready ? readyLabel : notReadyLabel}
      </span>
    </li>
  );
}

export function JobDocumentsReadiness({ job }: { job: Job }) {
  const { t } = useTranslation();
  const ctx = job.profileDocumentContext;
  const hasCv = ctx?.hasCvContent ?? Boolean(job.sourceCvFileName);
  const hasCover = ctx?.hasCoverLetterContent ?? Boolean(job.coverLetterTemplateFileName);
  const hasMaterials = job.documents.length > 0 || Boolean(job.generatedCoverLetterLink);
  const readyLabel = t("jobDetail.simple.ready");
  const notReadyLabel = t("jobDetail.simple.notReady");

  return (
    <SectionCard title={t("jobDetail.simple.documentsReady")}>
      <ul className="space-y-2">
        <ReadinessRow label={t("jobDetail.simple.cvReady")} ready={hasCv} readyLabel={readyLabel} notReadyLabel={notReadyLabel} />
        <ReadinessRow label={t("jobDetail.simple.coverLetterReady")} ready={hasCover} readyLabel={readyLabel} notReadyLabel={notReadyLabel} />
        <ReadinessRow label={t("jobDetail.simple.materialsReady")} ready={hasMaterials} readyLabel={readyLabel} notReadyLabel={notReadyLabel} />
      </ul>
      {!hasCv || !hasCover ? (
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-3)]">
          {t("jobDetail.simple.documentsHint")}{" "}
          <Link href="/documents" className="font-medium text-[var(--accent-hi)] hover:underline">
            {t("nav.docs")}
          </Link>
        </p>
      ) : null}
    </SectionCard>
  );
}

export function JobDetailSimpleHeader({ job }: { job: Job }) {
  const { t } = useTranslation();

  return (
    <header className="space-y-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] p-5">
      <div className="space-y-1">
        <p className="text-[15px] font-semibold text-[var(--text-1)]">{job.company}</p>
        <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em] text-[var(--text-1)] sm:text-[28px]">
          {job.position}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--text-3)]">
        {job.location ? (
          <span className="inline-flex items-center gap-1">
            <MapPinIcon size={14} className="shrink-0" />
            {job.location}
            {job.remote ? ` · ${t("jobs.remote")}` : ""}
          </span>
        ) : null}
        {job.source ? (
          <span className="rounded-full border border-[var(--border-subtle)] px-2.5 py-0.5 text-[12px]">
            {jobSourceDisplayLabel(job.source, t)}
          </span>
        ) : null}
      </div>
      <JobStatusBadge status={job.status} />
    </header>
  );
}
