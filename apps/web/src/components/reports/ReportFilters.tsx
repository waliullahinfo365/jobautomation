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
            { label: "All Types", value: "All" },
            { label: "Daily Digest", value: "Daily Digest" },
            { label: "Weekly Performance", value: "Weekly Performance" },
            { label: "PDF Export", value: "PDF Export" },
            { label: "Manual Report", value: "Manual Report" },
          ]}
        />
        <Select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as ReportFilterState["status"] })}
          options={[
            { label: "All Statuses", value: "All" },
            { label: "Sent", value: "Sent" },
            { label: "Generated", value: "Generated" },
            { label: "Failed", value: "Failed" },
            { label: "Scheduled", value: "Scheduled" },
          ]}
        />
        <div className="flex gap-2">
          <Select
            className="flex-1"
            value={filters.dateRange}
            onChange={(e) => onChange({ ...filters, dateRange: e.target.value as ReportFilterState["dateRange"] })}
            options={[
              { label: "All Dates", value: "All Dates" },
              { label: "Last 7 Days", value: "Last 7 Days" },
              { label: "Last 30 Days", value: "Last 30 Days" },
            ]}
          />
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
