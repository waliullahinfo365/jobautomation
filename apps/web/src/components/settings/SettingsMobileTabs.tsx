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
      className="sticky top-[var(--mobile-chrome-top)] z-30 -mx-1 bg-[var(--bg-0)]/95 pb-2 pt-1 backdrop-blur-md md:static md:bg-transparent md:backdrop-blur-none"
      role="tablist"
      aria-label={t("settings.simpleTitle")}
    >
      <div className="overflow-x-auto px-1 touch-pan-x [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex min-w-max items-center gap-1 rounded-xl bg-[var(--surface-2)] p-1">
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
                  "flex min-h-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-3.5 text-[13px] font-medium transition-colors touch-manipulation",
                  selected
                    ? "bg-[var(--surface-1)] text-[var(--accent-hi)] shadow-sm ring-1 ring-[var(--accent)]/20"
                    : "text-[var(--text-3)] active:bg-[var(--surface-3)]"
                )}
              >
                {t(SETTINGS_SECTION_I18N_KEY[section])}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
