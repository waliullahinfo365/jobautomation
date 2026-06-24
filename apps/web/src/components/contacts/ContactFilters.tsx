"use client";

import type { ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ContactFollowUpStatus, ContactRelationship } from "@/types/contact";
import { useTranslation } from "@/i18n/useTranslation";
import { contactFollowUpStatusLabelKey, contactRelationshipLabelKey } from "./contact-labels";

export interface ContactFilterState {
  query: string;
  relationship: ContactRelationship | "All";
  followUpStatus: ContactFollowUpStatus | "All";
  relatedJob: "All Jobs" | "Recent Jobs";
}

const RELATIONSHIPS: Array<ContactRelationship | "All"> = [
  "All",
  "Recruiter",
  "Hiring Manager",
  "Referral",
  "Employee",
  "Networking",
  "Other",
];

const FOLLOW_UPS: Array<ContactFollowUpStatus | "All"> = [
  "All",
  "Not Needed",
  "Scheduled",
  "Due Today",
  "Overdue",
  "Completed",
];

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
  const { t } = useTranslation();

  const relationshipOptions = RELATIONSHIPS.map((value) => ({
    value,
    label:
      value === "All"
        ? t("contacts.filters.allRelationships")
        : t(contactRelationshipLabelKey(value)),
  }));

  const followUpOptions = FOLLOW_UPS.map((value) => ({
    value,
    label:
      value === "All"
        ? t("contacts.filters.allFollowUpStatuses")
        : t(contactFollowUpStatusLabelKey(value)),
  }));

  return (
    <div className="premium-card p-4">
      {aside ? <div className="mb-3 flex justify-end">{aside}</div> : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]"
          />
          <Input
            className="pl-9"
            placeholder={t("contacts.searchPlaceholder")}
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </div>
        <Select
          value={filters.relationship}
          onChange={(e) => onChange({ ...filters, relationship: e.target.value as ContactFilterState["relationship"] })}
          options={relationshipOptions}
        />
        <Select
          value={filters.followUpStatus}
          onChange={(e) => onChange({ ...filters, followUpStatus: e.target.value as ContactFilterState["followUpStatus"] })}
          options={followUpOptions}
        />
        <div className="filter-reset-row">
          <Select
            className="w-full sm:flex-1"
            value={filters.relatedJob}
            onChange={(e) => onChange({ ...filters, relatedJob: e.target.value as ContactFilterState["relatedJob"] })}
            options={[
              { label: t("contacts.filters.allJobs"), value: "All Jobs" },
              { label: t("contacts.filters.recentJobs"), value: "Recent Jobs" },
            ]}
          />
          <Button variant="outline" className="w-full shrink-0 sm:w-auto" onClick={onClear}>
            {t("contacts.filters.clear")}
          </Button>
        </div>
      </div>
    </div>
  );
}
