"use client";

import type { ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { InterviewStatus, InterviewType } from "@/types/interview";

export interface InterviewFilterState {
  query: string;
  interviewType: InterviewType | "All";
  interviewStatus: InterviewStatus | "All";
  dateRange: "All Dates" | "This Week" | "Next Week";
}

export function InterviewFilters({
  filters,
  onChange,
  onClear,
  aside,
}: {
  filters: InterviewFilterState;
  onChange: (value: InterviewFilterState) => void;
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
            placeholder="Search company, position, interviewer, or email"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </div>
        <Select
          value={filters.interviewType}
          onChange={(e) => onChange({ ...filters, interviewType: e.target.value as InterviewFilterState["interviewType"] })}
          options={[
            { label: "All Types", value: "All" },
            { label: "Recruiter Screen", value: "Recruiter Screen" },
            { label: "Technical", value: "Technical" },
            { label: "Behavioral", value: "Behavioral" },
            { label: "Hiring Manager", value: "Hiring Manager" },
            { label: "Panel", value: "Panel" },
            { label: "Final Round", value: "Final Round" },
            { label: "Offer Discussion", value: "Offer Discussion" },
          ]}
        />
        <Select
          value={filters.interviewStatus}
          onChange={(e) => onChange({ ...filters, interviewStatus: e.target.value as InterviewFilterState["interviewStatus"] })}
          options={[
            { label: "All Statuses", value: "All" },
            { label: "Scheduled", value: "Scheduled" },
            { label: "Awaiting Confirmation", value: "Awaiting Confirmation" },
            { label: "Rescheduled", value: "Rescheduled" },
            { label: "Completed", value: "Completed" },
            { label: "Cancelled", value: "Cancelled" },
            { label: "No Show", value: "No Show" },
          ]}
        />
        <div className="flex gap-2">
          <Select
            className="flex-1"
            value={filters.dateRange}
            onChange={(e) => onChange({ ...filters, dateRange: e.target.value as InterviewFilterState["dateRange"] })}
            options={[
              { label: "All Dates", value: "All Dates" },
              { label: "This Week", value: "This Week" },
              { label: "Next Week", value: "Next Week" },
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
