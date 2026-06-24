"use client";

import type { ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ReportStatus, ReportType } from "@/types/report";
import { useTranslation } from "@/i18n/I18nProvider";

export interface ReportFilterState {
  query: string;
  type: ReportType | "All";
  status: ReportStatus | "All";
  dateRange: "All Dates" | "Last 7 Days" | "Last 30 Days";
}

export function ReportFilters({
  filters,
  onChange,
  onClear,
  aside,
}: {
  filters: ReportFilterState;
  onChange: (f: ReportFilterState) => void;
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
            placeholder={t("reports.searchByReportName")}
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </div>
        <Select
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value as ReportFilterState["type"] })}
          options={[
            { label: t("reports.filters.allTypes"), value: "All" },
            { label: t("reports.reportType.dailyDigest"), value: "Daily Digest" },
            { label: t("reports.reportType.weeklyPerformance"), value: "Weekly Performance" },
            { label: t("reports.reportType.pdfExport"), value: "PDF Export" },
            { label: t("reports.filters.manualReport"), value: "Manual Report" },
          ]}
        />
        <Select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as ReportFilterState["status"] })}
          options={[
            { label: t("reports.filters.allStatuses"), value: "All" },
            { label: t("reports.reportStatus.sent"), value: "Sent" },
            { label: t("reports.reportStatus.generated"), value: "Generated" },
            { label: t("reports.reportStatus.failed"), value: "Failed" },
            { label: t("reports.filters.scheduled"), value: "Scheduled" },
          ]}
        />
        <div className="filter-reset-row">
          <Select
            className="w-full sm:flex-1"
            value={filters.dateRange}
            onChange={(e) => onChange({ ...filters, dateRange: e.target.value as ReportFilterState["dateRange"] })}
            options={[
              { label: t("reports.filters.allDates"), value: "All Dates" },
              { label: t("reports.filters.last7Days"), value: "Last 7 Days" },
              { label: t("reports.filters.last30Days"), value: "Last 30 Days" },
            ]}
          />
          <Button variant="outline" className="w-full shrink-0 sm:w-auto" onClick={onClear}>
            {t("reports.filters.clear")}
          </Button>
        </div>
      </div>
    </div>
  );
}
