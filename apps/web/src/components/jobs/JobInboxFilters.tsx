"use client";

import { useState } from "react";
import type { JobFilters as JobFiltersType } from "@/types/job";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";
import { jobFilterPriorityLabel, jobFilterSourceLabel, jobFilterStatusLabel } from "@/i18n/job-filters";
import { cn } from "@/lib/utils";

interface JobInboxFiltersProps {
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

export function JobInboxFilters({ filters, onChange, onClear }: JobInboxFiltersProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const hasActiveFilters =
    Boolean(filters.query) ||
    (filters.status && filters.status !== "All") ||
    (filters.priority && filters.priority !== "All") ||
    (filters.source && filters.source !== "All");

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
          <Input
            placeholder={t("jobs.inbox.searchPlaceholder")}
            className="min-h-[44px] pl-9"
            value={filters.query ?? ""}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className={cn("min-h-[44px] shrink-0 px-4", open && "border-[var(--accent-ring)] bg-[var(--accent-bg)]")}
          onClick={() => setOpen((v) => !v)}
        >
          {t("jobs.inbox.filter")}
          {hasActiveFilters ? <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent-hi)]" /> : null}
        </Button>
      </div>

      {open ? (
        <div className="grid gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
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
          <Select
            value={filters.source ?? "All"}
            onChange={(e) => onChange({ ...filters, source: e.target.value as JobFiltersType["source"] })}
            options={SOURCES.map((value) => ({
              value: String(value),
              label: jobFilterSourceLabel(value as JobFiltersType["source"], t),
            }))}
          />
          <Button type="button" variant="outline" className="min-h-[44px] w-full" onClick={onClear}>
            {t("jobs.clear")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
