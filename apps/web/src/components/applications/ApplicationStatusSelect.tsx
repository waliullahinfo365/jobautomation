"use client";

import type { ApplicationStatus } from "@/types/application";
import { Select } from "@/components/ui/select";

interface ApplicationStatusSelectProps {
  value:     ApplicationStatus;
  onChange:  (status: ApplicationStatus) => void;
  disabled?: boolean;
}

export function ApplicationStatusSelect({ value, onChange, disabled }: ApplicationStatusSelectProps) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as ApplicationStatus)}
      options={[
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
  );
}
