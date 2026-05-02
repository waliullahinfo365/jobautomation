"use client";

import type { ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { AutomationCategory, AutomationStatus } from "@/types/automation";

export interface AutomationFilterState {
  query: string;
  status: AutomationStatus | "All";
  category: AutomationCategory | "All";
}

interface AutomationFiltersProps {
  filters: AutomationFilterState;
  onChange: (filters: AutomationFilterState) => void;
  onClear: () => void;
  aside?: ReactNode;
}

export function AutomationFilters({ filters, onChange, onClear, aside }: AutomationFiltersProps) {
  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
      {aside ? <div className="mb-3 flex justify-end">{aside}</div> : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative xl:col-span-2">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
          <Input
            className="pl-9"
            placeholder="Search by module name or description"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </div>

        <Select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as AutomationFilterState["status"] })}
          options={[
            { label: "All Statuses", value: "All" },
            { label: "Active", value: "Active" },
            { label: "Paused", value: "Paused" },
            { label: "Failed", value: "Failed" },
            { label: "Needs Setup", value: "Needs Setup" },
          ]}
        />

        <div className="flex gap-2">
          <Select
            className="flex-1"
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value as AutomationFilterState["category"] })}
            options={[
              { label: "All Categories", value: "All" },
              { label: "Intake", value: "Intake" },
              { label: "Pipeline", value: "Pipeline" },
              { label: "Documents", value: "Documents" },
              { label: "Communication", value: "Communication" },
              { label: "AI Processing", value: "AI Processing" },
              { label: "Reporting", value: "Reporting" },
              { label: "Monitoring", value: "Monitoring" },
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
