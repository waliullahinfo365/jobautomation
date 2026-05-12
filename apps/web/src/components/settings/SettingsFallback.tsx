"use client";

import { useTranslation } from "@/i18n/useTranslation";

export function SettingsFallback() {
  const { t } = useTranslation();

  return <div className="p-6 text-sm text-muted-foreground">{t("settings.loading")}</div>;
}
