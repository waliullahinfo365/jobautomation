"use client";

import type { ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import type { DocumentStatus, DocumentType } from "@/types/document";

export interface DocumentFilterState {
  query: string;
  type: DocumentType | "All";
  status: DocumentStatus | "All";
  relatedJob: "All Jobs" | "Recent Jobs";
}

export function DocumentFilters({
  filters,
  onChange,
  onClear,
  aside,
}: {
  filters: DocumentFilterState;
  onChange: (f: DocumentFilterState) => void;
  onClear: () => void;
  aside?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
      {aside ? <div className="mb-3 flex justify-end">{aside}</div> : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
          <Input
            className="pl-9"
            placeholder={t("documents.filters.searchPlaceholder")}
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </div>
        <Select
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value as DocumentFilterState["type"] })}
          options={[
            { label: t("documents.filters.allTypes"), value: "All" },
            { label: t("documents.documentType.cv"), value: "CV" },
            { label: t("documents.documentType.coverLetter"), value: "Cover Letter" },
            { label: t("documents.documentType.researchDocument"), value: "Research Document" },
            { label: t("documents.documentType.pdfExport"), value: "PDF Export" },
            { label: t("documents.documentType.jobFolder"), value: "Job Folder" },
            { label: t("documents.documentType.emailTemplate"), value: "Email Template" },
          ]}
        />
        <Select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as DocumentFilterState["status"] })}
          options={[
            { label: t("documents.filters.allStatuses"), value: "All" },
            { label: t("documents.documentStatus.draft"), value: "Draft" },
            { label: t("documents.documentStatus.ready"), value: "Ready" },
            { label: t("documents.documentStatus.exported"), value: "Exported" },
            { label: t("documents.documentStatus.failed"), value: "Failed" },
            { label: t("documents.documentStatus.needsReview"), value: "Needs Review" },
            { label: t("documents.documentStatus.archived"), value: "Archived" },
          ]}
        />
        <div className="flex gap-2">
          <Select
            className="flex-1"
            value={filters.relatedJob}
            onChange={(e) => onChange({ ...filters, relatedJob: e.target.value as DocumentFilterState["relatedJob"] })}
            options={[
              { label: t("documents.filters.allJobs"), value: "All Jobs" },
              { label: t("documents.filters.recentJobs"), value: "Recent Jobs" },
            ]}
          />
          <Button variant="outline" onClick={onClear}>
            {t("documents.filters.clear")}
          </Button>
        </div>
      </div>
    </div>
  );
}
