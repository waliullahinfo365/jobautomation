"use client";

import type { ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ApplicationStatus, FollowUpStatus, ResponseStatus } from "@/types/application";
import { useTranslation } from "@/i18n/useTranslation";

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
  aside?: ReactNode;
}

export function ApplicationFilters({ filters, onChange, onClear, aside }: ApplicationFiltersProps) {
  const { t } = useTranslation();

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
            placeholder={t("applications.filters.searchPlaceholder")}
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </div>

        <Select
          value={filters.applicationStatus}
          onChange={(e) => onChange({ ...filters, applicationStatus: e.target.value as ApplicationFilterState["applicationStatus"] })}
          options={[
            { label: t("applications.filters.allApplicationStatuses"), value: "All" },
            { label: t("applications.applicationStatus.drafted"), value: "Drafted" },
            { label: t("applications.applicationStatus.ready"), value: "Ready" },
            { label: t("applications.applicationStatus.inProgress"), value: "In Progress" },
            { label: t("applications.applicationStatus.applied"), value: "Applied" },
            { label: t("applications.applicationStatus.followUpDue"), value: "Follow-Up Due" },
            { label: t("applications.applicationStatus.replied"), value: "Replied" },
            { label: t("applications.applicationStatus.interview"), value: "Interview" },
            { label: t("applications.applicationStatus.offer"), value: "Offer" },
            { label: t("applications.applicationStatus.rejected"), value: "Rejected" },
            { label: t("applications.applicationStatus.archived"), value: "Archived" },
          ]}
        />

        <Select
          value={filters.responseStatus}
          onChange={(e) => onChange({ ...filters, responseStatus: e.target.value as ApplicationFilterState["responseStatus"] })}
          options={[
            { label: t("applications.filters.allResponseStatuses"), value: "All" },
            { label: t("applications.responseStatus.noResponse"), value: "No Response" },
            { label: t("applications.responseStatus.positiveReply"), value: "Positive Reply" },
            { label: t("applications.responseStatus.negativeReply"), value: "Negative Reply" },
            { label: t("applications.responseStatus.autoReply"), value: "Auto Reply" },
            { label: t("applications.responseStatus.needsReview"), value: "Needs Review" },
          ]}
        />

        <Select
          value={filters.followUpStatus}
          onChange={(e) => onChange({ ...filters, followUpStatus: e.target.value as ApplicationFilterState["followUpStatus"] })}
          options={[
            { label: t("applications.filters.allFollowupStatuses"), value: "All" },
            { label: t("applications.followUpStatus.notNeeded"), value: "Not Needed" },
            { label: t("applications.followUpStatus.scheduled"), value: "Scheduled" },
            { label: t("applications.followUpStatus.dueToday"), value: "Due Today" },
            { label: t("applications.followUpStatus.overdue"), value: "Overdue" },
            { label: t("applications.followUpStatus.sent"), value: "Sent" },
          ]}
        />

        <div className="flex gap-2">
          <Select
            className="flex-1"
            value={filters.dateRange}
            onChange={(e) => onChange({ ...filters, dateRange: e.target.value as ApplicationFilterState["dateRange"] })}
            options={[
              { label: t("applications.filters.allDates"), value: "All Dates" },
              { label: t("applications.filters.last7Days"), value: "Last 7 Days" },
              { label: t("applications.filters.last30Days"), value: "Last 30 Days" },
            ]}
          />
          <Button variant="outline" onClick={onClear}>
            {t("applications.filters.clear")}
          </Button>
        </div>
      </div>
    </div>
  );
}
