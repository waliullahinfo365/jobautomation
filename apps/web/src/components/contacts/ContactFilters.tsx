"use client";

import type { ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ContactFollowUpStatus, ContactRelationship } from "@/types/contact";

export interface ContactFilterState {
  query: string;
  relationship: ContactRelationship | "All";
  followUpStatus: ContactFollowUpStatus | "All";
  relatedJob: "All Jobs" | "Recent Jobs";
}

export function ContactFilters({
  filters,
  onChange,
  onClear,
  aside,
}: {
  filters: ContactFilterState;
  onChange: (filters: ContactFilterState) => void;
  onClear: () => void;
  aside?: ReactNode;
}) {
  return (
    <div className="premium-card p-4">
      {aside ? <div className="mb-3 flex justify-end">{aside}</div> : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
          <Input
            className="pl-9"
            placeholder="Search name, company, role, email, or LinkedIn URL"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </div>
        <Select
          value={filters.relationship}
          onChange={(e) => onChange({ ...filters, relationship: e.target.value as ContactFilterState["relationship"] })}
          options={[
            { label: "All Relationships", value: "All" },
            { label: "Recruiter", value: "Recruiter" },
            { label: "Hiring Manager", value: "Hiring Manager" },
            { label: "Referral", value: "Referral" },
            { label: "Employee", value: "Employee" },
            { label: "Networking", value: "Networking" },
            { label: "Other", value: "Other" },
          ]}
        />
        <Select
          value={filters.followUpStatus}
          onChange={(e) => onChange({ ...filters, followUpStatus: e.target.value as ContactFilterState["followUpStatus"] })}
          options={[
            { label: "All Follow-up Statuses", value: "All" },
            { label: "Not Needed", value: "Not Needed" },
            { label: "Scheduled", value: "Scheduled" },
            { label: "Due Today", value: "Due Today" },
            { label: "Overdue", value: "Overdue" },
            { label: "Completed", value: "Completed" },
          ]}
        />
        <div className="flex gap-2">
          <Select
            className="flex-1"
            value={filters.relatedJob}
            onChange={(e) => onChange({ ...filters, relatedJob: e.target.value as ContactFilterState["relatedJob"] })}
            options={[{ label: "All Jobs", value: "All Jobs" }, { label: "Recent Jobs", value: "Recent Jobs" }]}
          />
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
