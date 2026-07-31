import type { ReactNode } from "react";
import type { Job } from "@/types/job";
import { SectionCard } from "@/components/shared/SectionCard";
import { formatDate } from "@/lib/utils";
import { ExternalLinkIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/I18nProvider";

interface JobOverviewCardProps {
  job: Job;
}

export function JobOverviewCard({ job }: JobOverviewCardProps) {
  const { t } = useTranslation();
  return (
    <SectionCard title={t("jobs.jobOverview")}>
      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <OverviewItem label={t("jobs.company")} value={job.company} />
        <OverviewItem label={t("jobs.position")} value={job.position} />
        <OverviewItem label={t("jobs.location")} value={`${job.location}${job.remote ? ` (${t("jobs.remote")})` : ""}`} />
        <OverviewItem label={t("jobs.source")} value={job.source} />
        <OverviewItem
          label={t("jobs.jobUrl")}
          value={
            <a
              href={job.jobUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[var(--text-2)] hover:underline"
            >
              {t("jobs.openPosting")} <ExternalLinkIcon size={14} />
            </a>
          }
        />
        <OverviewItem label={t("jobs.salaryRange")} value={job.salaryRange} />
        <OverviewItem label={t("jobs.deadline")} value={job.deadline ? formatDate(job.deadline) : "—"} />
        <OverviewItem label={t("jobs.dateFound")} value={formatDate(job.dateFound)} />
        <OverviewItem label={t("jobs.dateApplied")} value={job.dateApplied ? formatDate(job.dateApplied) : "—"} />
        <OverviewItem label={t("jobs.contactEmail")} value={job.contactEmail ?? "—"} />
        {job.driveFolderLink ? (
          <OverviewItem
            label={t("jobs.openDriveJobFolder")}
            value={<ExternalLink href={job.driveFolderLink} />}
          />
        ) : null}
        {job.researchFolderLink ? (
          <OverviewItem
            label={t("jobs.openResearchFolder")}
            value={<ExternalLink href={job.researchFolderLink} />}
          />
        ) : null}
        {job.coverLetterFolderLink ? (
          <OverviewItem
            label={t("jobs.openCoverLetterFolder")}
            value={<ExternalLink href={job.coverLetterFolderLink} />}
          />
        ) : null}
        {job.aiDraftDocUrl ? (
          <OverviewItem
            label={t("jobs.openAiDraftGoogleDoc")}
            value={<ExternalLink href={job.aiDraftDocUrl} />}
          />
        ) : null}
      </div>
    </SectionCard>
  );
}

function ExternalLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-[var(--text-2)] hover:underline"
    >
      Open <ExternalLinkIcon size={14} />
    </a>
  );
}

function OverviewItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="font-medium text-[var(--text-1)]">{value}</p>
    </div>
  );
}
