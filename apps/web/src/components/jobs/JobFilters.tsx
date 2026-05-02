"use client";

import type { JobFilters as JobFiltersType } from "@/types/job";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "@/components/icons";

interface JobFiltersProps {
  filters: JobFiltersType;
  onChange: (filters: JobFiltersType) => void;
  onClear: () => void;
}

export function JobFilters({ filters, onChange, onClear }: JobFiltersProps) {
  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
          <Input
            placeholder="Search by company, position, or source"
            className="pl-9"
            value={filters.query ?? ""}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </div>

        <Select
          value={filters.status ?? "All"}
          onChange={(e) => onChange({ ...filters, status: e.target.value as JobFiltersType["status"] })}
          options={[
            { label: "All Statuses", value: "All" },
            { label: "New", value: "New" },
            { label: "Research", value: "Research" },
            { label: "Drafting", value: "Drafting" },
            { label: "Ready to Apply", value: "Ready to Apply" },
            { label: "Applied", value: "Applied" },
            { label: "Interview", value: "Interview" },
            { label: "Offer", value: "Offer" },
            { label: "Rejected", value: "Rejected" },
            { label: "Archived", value: "Archived" },
          ]}
        />

        <Select
          value={filters.priority ?? "All"}
          onChange={(e) => onChange({ ...filters, priority: e.target.value as JobFiltersType["priority"] })}
          options={[
            { label: "All Priorities", value: "All" },
            { label: "Low", value: "Low" },
            { label: "Medium", value: "Medium" },
            { label: "High", value: "High" },
            { label: "Urgent", value: "Urgent" },
          ]}
        />

        <div className="flex gap-2">
          <Select
            value={filters.source ?? "All"}
            onChange={(e) => onChange({ ...filters, source: e.target.value as JobFiltersType["source"] })}
            options={[
              { label: "All Sources", value: "All" },
              { label: "Gmail", value: "Gmail" },
              { label: "LinkedIn", value: "LinkedIn" },
              { label: "Indeed", value: "Indeed" },
              { label: "Company Website", value: "Company Website" },
              { label: "Referral", value: "Referral" },
              { label: "Manual", value: "Manual" },
            ]}
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
