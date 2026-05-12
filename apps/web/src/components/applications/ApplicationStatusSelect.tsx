"use client";

import { useMemo } from "react";
import type { ApplicationStatus } from "@/types/application";
import { Select } from "@/components/ui/select";
import { useTranslation } from "@/i18n/useTranslation";

interface ApplicationStatusSelectProps {
  value:     ApplicationStatus;
  onChange:  (status: ApplicationStatus) => void;
  disabled?: boolean;
}

export function ApplicationStatusSelect({ value, onChange, disabled }: ApplicationStatusSelectProps) {
  const { t } = useTranslation();

  const options = useMemo(() => [
    { label: t("applications.applicationStatus.drafted"), value: "Drafted" },
    { label: t("applications.applicationStatus.ready"), value: "Ready" },
    { label: t("applications.applicationStatus.applied"), value: "Applied" },
    { label: t("applications.applicationStatus.followUpDue"), value: "Follow-Up Due" },
    { label: t("applications.applicationStatus.replied"), value: "Replied" },
    { label: t("applications.applicationStatus.interview"), value: "Interview" },
    { label: t("applications.applicationStatus.offer"), value: "Offer" },
    { label: t("applications.applicationStatus.rejected"), value: "Rejected" },
    { label: t("applications.applicationStatus.archived"), value: "Archived" },
  ], [t]);

  return (
    <Select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as ApplicationStatus)}
      options={options}
    />
  );
}
