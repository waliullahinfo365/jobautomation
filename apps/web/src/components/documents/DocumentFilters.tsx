"use client";

import type { ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
      {aside ? <div className="mb-3 flex justify-end">{aside}</div> : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
          <Input
            className="pl-9"
            placeholder="Search by file, company, position, or type"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </div>
        <Select
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value as DocumentFilterState["type"] })}
          options={[
            { label: "All Types", value: "All" },
            { label: "CV", value: "CV" },
            { label: "Cover Letter", value: "Cover Letter" },
            { label: "Research Document", value: "Research Document" },
            { label: "PDF Export", value: "PDF Export" },
            { label: "Job Folder", value: "Job Folder" },
            { label: "Email Template", value: "Email Template" },
          ]}
        />
        <Select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as DocumentFilterState["status"] })}
          options={[
            { label: "All Statuses", value: "All" },
            { label: "Draft", value: "Draft" },
            { label: "Ready", value: "Ready" },
            { label: "Exported", value: "Exported" },
            { label: "Failed", value: "Failed" },
            { label: "Needs Review", value: "Needs Review" },
            { label: "Archived", value: "Archived" },
          ]}
        />
        <div className="flex gap-2">
          <Select
            className="flex-1"
            value={filters.relatedJob}
            onChange={(e) => onChange({ ...filters, relatedJob: e.target.value as DocumentFilterState["relatedJob"] })}
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
