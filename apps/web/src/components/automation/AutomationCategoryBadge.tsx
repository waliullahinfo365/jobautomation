"use client";

import { Badge } from "@/components/ui/badge";
import type { AutomationCategory } from "@/types/automation";
import { useTranslation } from "@/i18n/useTranslation";

function categoryLabel(category: AutomationCategory, t: (key: string) => string): string {
  switch (category) {
    case "Intake":
      return t("automation.category.intake");
    case "Pipeline":
      return t("automation.category.pipeline");
    case "Documents":
      return t("automation.category.documents");
    case "Communication":
      return t("automation.category.communication");
    case "AI Processing":
      return t("automation.category.aiProcessing");
    case "Reporting":
      return t("automation.category.reporting");
    case "Monitoring":
      return t("automation.category.monitoring");
    default:
      return category;
  }
}

export function AutomationCategoryBadge({ category }: { category: AutomationCategory }) {
  const { t } = useTranslation();
  return <Badge variant="default">{categoryLabel(category, t)}</Badge>;
}
