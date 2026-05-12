"use client";

import type { ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTranslation } from "@/i18n/useTranslation";
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
  const { t } = useTranslation();
  return (
    <div className="premium-card p-4">
      {aside ? <div className="mb-3 flex justify-end">{aside}</div> : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
          <Input
            className="pl-9"
            placeholder={t("interviews.filters.searchPlaceholder")}
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </div>
        <Select
          value={filters.interviewType}
          onChange={(e) => onChange({ ...filters, interviewType: e.target.value as InterviewFilterState["interviewType"] })}
          options={[
            { label: t("interviews.filters.allTypes"), value: "All" },
            { label: t("interviews.interviewType.recruiterScreen"), value: "Recruiter Screen" },
            { label: t("interviews.interviewType.technical"), value: "Technical" },
            { label: t("interviews.interviewType.behavioral"), value: "Behavioral" },
            { label: t("interviews.interviewType.hiringManager"), value: "Hiring Manager" },
            { label: t("interviews.interviewType.panel"), value: "Panel" },
            { label: t("interviews.interviewType.finalRound"), value: "Final Round" },
            { label: t("interviews.interviewType.offerDiscussion"), value: "Offer Discussion" },
          ]}
        />
        <Select
          value={filters.interviewStatus}
          onChange={(e) => onChange({ ...filters, interviewStatus: e.target.value as InterviewFilterState["interviewStatus"] })}
          options={[
            { label: t("interviews.filters.allStatuses"), value: "All" },
            { label: t("interviews.interviewStatus.scheduled"), value: "Scheduled" },
            { label: t("interviews.interviewStatus.awaitingConfirmation"), value: "Awaiting Confirmation" },
            { label: t("interviews.interviewStatus.rescheduled"), value: "Rescheduled" },
            { label: t("interviews.interviewStatus.completed"), value: "Completed" },
            { label: t("interviews.interviewStatus.cancelled"), value: "Cancelled" },
            { label: t("interviews.interviewStatus.noShow"), value: "No Show" },
          ]}
        />
        <div className="flex gap-2">
          <Select
            className="flex-1"
            value={filters.dateRange}
            onChange={(e) => onChange({ ...filters, dateRange: e.target.value as InterviewFilterState["dateRange"] })}
            options={[
              { label: t("interviews.filters.allDates"), value: "All Dates" },
              { label: t("interviews.filters.thisWeek"), value: "This Week" },
              { label: t("interviews.filters.nextWeek"), value: "Next Week" },
            ]}
          />
          <Button variant="outline" onClick={onClear}>
            {t("interviews.filters.clear")}
          </Button>
        </div>
      </div>
    </div>
  );
}
