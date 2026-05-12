"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";

function categoryLabel(category: string, t: (key: string) => string): string {
  switch (category) {
    case "Intake":
      return t("automation.category.intake");
    case "Jobs":
      return t("nav.jobs");
    case "Applications":
      return t("nav.applications");
    case "Pipeline":
      return t("automation.category.pipeline");
    case "Documents":
      return t("automation.category.documents");
    case "Contacts":
      return t("nav.contacts");
    case "Communication":
      return t("automation.category.communication");
    case "AI Processing":
      return t("automation.category.aiProcessing");
    case "Reporting":
    case "Reports":
      return t("automation.category.reporting");
    case "Monitoring":
      return t("automation.category.monitoring");
    case "System":
      return t("nav.systemStatus");
    default:
      return category;
  }
}

export function AutomationCategoryBadge({ category }: { category: string }) {
  const { t } = useTranslation();
  return <Badge variant="default">{categoryLabel(category, t)}</Badge>;
}
