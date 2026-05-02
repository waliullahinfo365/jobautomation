"use client";

import type { ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ApplicationStatus, FollowUpStatus, ResponseStatus } from "@/types/application";

export interface ApplicationFilterState {
  query: string;
  applicationStatus: ApplicationStatus | "All";
  responseStatus: ResponseStatus | "All";
  followUpStatus: FollowUpStatus | "All";
  dateRange: "All Dates" | "Last 7 Days" | "Last 30 Days";
}

interface ApplicationFiltersProps {
  filters: ApplicationFilterState;
  onChange: (filters: ApplicationFilterState) => void;
  onClear: () => void;
  /** e.g. API / mock status chip */
  aside?: ReactNode;
}

export function ApplicationFilters({ filters, onChange, onClear, aside }: ApplicationFiltersProps) {
  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
      {aside ? (
        <div className="mb-3 flex justify-end">{aside}</div>
      ) : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="relative xl:col-span-2">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
          <Input
            className="pl-9"
            placeholder="Search by company, position, or contact email"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </div>

        <Select
          value={filters.applicationStatus}
          onChange={(e) => onChange({ ...filters, applicationStatus: e.target.value as ApplicationFilterState["applicationStatus"] })}
          options={[
            { label: "All Application Statuses", value: "All" },
            { label: "Drafted", value: "Drafted" },
            { label: "Ready", value: "Ready" },
            { label: "Applied", value: "Applied" },
            { label: "Follow-Up Due", value: "Follow-Up Due" },
            { label: "Replied", value: "Replied" },
            { label: "Interview", value: "Interview" },
            { label: "Offer", value: "Offer" },
            { label: "Rejected", value: "Rejected" },
            { label: "Archived", value: "Archived" },
          ]}
        />

        <Select
          value={filters.responseStatus}
          onChange={(e) => onChange({ ...filters, responseStatus: e.target.value as ApplicationFilterState["responseStatus"] })}
          options={[
            { label: "All Response Statuses", value: "All" },
            { label: "No Response", value: "No Response" },
            { label: "Positive Reply", value: "Positive Reply" },
            { label: "Negative Reply", value: "Negative Reply" },
            { label: "Auto Reply", value: "Auto Reply" },
            { label: "Needs Review", value: "Needs Review" },
          ]}
        />

        <Select
          value={filters.followUpStatus}
          onChange={(e) => onChange({ ...filters, followUpStatus: e.target.value as ApplicationFilterState["followUpStatus"] })}
          options={[
            { label: "All Follow-Up Statuses", value: "All" },
            { label: "Not Needed", value: "Not Needed" },
            { label: "Scheduled", value: "Scheduled" },
            { label: "Due Today", value: "Due Today" },
            { label: "Overdue", value: "Overdue" },
            { label: "Sent", value: "Sent" },
          ]}
        />

        <div className="flex gap-2">
          <Select
            className="flex-1"
            value={filters.dateRange}
            onChange={(e) => onChange({ ...filters, dateRange: e.target.value as ApplicationFilterState["dateRange"] })}
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
