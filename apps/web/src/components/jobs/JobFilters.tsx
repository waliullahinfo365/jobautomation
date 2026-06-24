"use client";

import type { JobFilters as JobFiltersType } from "@/types/job";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";
import { jobFilterPriorityLabel, jobFilterSourceLabel, jobFilterStatusLabel } from "@/i18n/job-filters";

interface JobFiltersProps {
  filters: JobFiltersType;
  onChange: (filters: JobFiltersType) => void;
  onClear: () => void;
}

const STATUSES = [
  "All",
  "New",
  "Saved",
  "Drafting",
  "Ready",
  "Applied",
  "Interview",
  "Offer",
  "Closed",
] as const satisfies readonly JobFiltersType["status"][];

const PRIORITIES = ["All", "Low", "Medium", "High", "Urgent"] as const satisfies readonly JobFiltersType["priority"][];

const SOURCES = [
  "All",
  "Gmail",
  "LinkedIn",
  "Indeed",
  "Stepstone",
  "Xing",
  "Glassdoor",
  "Monster",
  "Company Website",
  "Referral",
  "Manual",
  "Other",
] as const satisfies readonly JobFiltersType["source"][];

export function JobFilters({ filters, onChange, onClear }: JobFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
          <Input
            placeholder={t("jobs.searchPlaceholder")}
            className="pl-9"
            value={filters.query ?? ""}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </div>

        <Select
          value={filters.status ?? "All"}
          onChange={(e) => onChange({ ...filters, status: e.target.value as JobFiltersType["status"] })}
          options={STATUSES.map((value) => ({
            value: String(value),
            label: jobFilterStatusLabel(value as JobFiltersType["status"], t),
          }))}
        />

        <Select
          value={filters.priority ?? "All"}
          onChange={(e) => onChange({ ...filters, priority: e.target.value as JobFiltersType["priority"] })}
          options={PRIORITIES.map((value) => ({
            value: String(value),
            label: jobFilterPriorityLabel(value as JobFiltersType["priority"], t),
          }))}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={filters.source ?? "All"}
            onChange={(e) => onChange({ ...filters, source: e.target.value as JobFiltersType["source"] })}
            options={SOURCES.map((value) => ({
              value: String(value),
              label: jobFilterSourceLabel(value as JobFiltersType["source"], t),
            }))}
            className="w-full sm:flex-1"
          />
          <Button type="button" variant="outline" className="w-full shrink-0 sm:w-auto" onClick={onClear}>
            {t("jobs.clear")}
          </Button>
        </div>
      </div>
    </div>
  );
}
