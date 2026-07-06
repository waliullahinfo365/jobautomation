"use client";

import Link from "next/link";
import type { SettingsSection } from "@/types/settings";
import { SETTINGS_SECTION_I18N_KEY } from "@/i18n/settings-sections";
import { useTranslation } from "@/i18n/useTranslation";
import { settingsSectionHref } from "@/lib/settings-routing";
import { cn } from "@/lib/utils";

interface SettingsMobileTabsProps {
  sections: SettingsSection[];
  activeSection: SettingsSection;
}

export function SettingsMobileTabs({ sections, activeSection }: SettingsMobileTabsProps) {
  const { t } = useTranslation();

  return (
    <div
      className="relative z-40 grid grid-cols-2 gap-2 sm:grid-cols-4"
      role="tablist"
      aria-label={t("settings.simpleTitle")}
    >
      {sections.map((section) => {
        const selected = activeSection === section;
        return (
          <Link
            key={section}
            href={settingsSectionHref(section)}
            scroll={false}
            replace
            role="tab"
            aria-selected={selected}
            className={cn(
              "flex min-h-[48px] items-center justify-center rounded-xl px-2 py-2.5 text-center text-xs font-medium leading-snug transition-colors touch-manipulation sm:text-sm",
              selected
                ? "bg-[var(--accent-bg)] text-[var(--accent-hi)] ring-1 ring-[var(--accent)]/25"
                : "bg-[var(--surface-2)] text-[var(--text-2)] active:bg-[var(--surface-3)]"
            )}
          >
            {t(SETTINGS_SECTION_I18N_KEY[section])}
          </Link>
        );
      })}
    </div>
  );
}
