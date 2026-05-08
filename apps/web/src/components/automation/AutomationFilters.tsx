"use client";

import type { ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { AutomationCategory, AutomationStatus } from "@/types/automation";
import { useTranslation } from "@/i18n/useTranslation";

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
  const { t } = useTranslation();
  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
      {aside ? <div className="mb-3 flex justify-end">{aside}</div> : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative xl:col-span-2">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
          <Input
            className="pl-9"
            placeholder={t("automation.filter.searchPlaceholder")}
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </div>

        <Select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as AutomationFilterState["status"] })}
          options={[
            { label: t("automation.filter.allStatuses"), value: "All" },
            { label: t("automation.moduleStatus.active"), value: "Active" },
            { label: t("automation.moduleStatus.paused"), value: "Paused" },
            { label: t("automation.moduleStatus.failed"), value: "Failed" },
            { label: t("automation.moduleStatus.needsSetup"), value: "Needs Setup" },
          ]}
        />

        <div className="flex gap-2">
          <Select
            className="flex-1"
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value as AutomationFilterState["category"] })}
            options={[
              { label: t("automation.filter.allCategories"), value: "All" },
              { label: t("automation.category.intake"), value: "Intake" },
              { label: t("automation.category.pipeline"), value: "Pipeline" },
              { label: t("automation.category.documents"), value: "Documents" },
              { label: t("automation.category.communication"), value: "Communication" },
              { label: t("automation.category.aiProcessing"), value: "AI Processing" },
              { label: t("automation.category.reporting"), value: "Reporting" },
              { label: t("automation.category.monitoring"), value: "Monitoring" },
            ]}
          />
          <Button variant="outline" onClick={onClear}>
            {t("automation.filter.clear")}
          </Button>
        </div>
      </div>
    </div>
  );
}
