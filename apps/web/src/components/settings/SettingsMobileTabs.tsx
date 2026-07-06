"use client";

import type { SettingsSection } from "@/types/settings";
import { SETTINGS_SECTION_I18N_KEY } from "@/i18n/settings-sections";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

interface SettingsMobileTabsProps {
  sections: SettingsSection[];
  activeSection: SettingsSection;
  onChange: (section: SettingsSection) => void;
}

export function SettingsMobileTabs({ sections, activeSection, onChange }: SettingsMobileTabsProps) {
  const { t } = useTranslation();

  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      role="tablist"
      aria-label={t("settings.simpleTitle")}
    >
      {sections.map((section) => {
        const selected = activeSection === section;
        return (
          <button
            key={section}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(section)}
            className={cn(
              "min-h-[48px] rounded-xl px-2 py-2.5 text-center text-xs font-medium leading-snug transition-colors touch-manipulation sm:text-sm",
              selected
                ? "bg-[var(--accent-bg)] text-[var(--accent-hi)] ring-1 ring-[var(--accent)]/25"
                : "bg-[var(--surface-2)] text-[var(--text-2)] active:bg-[var(--surface-3)]"
            )}
          >
            {t(SETTINGS_SECTION_I18N_KEY[section])}
          </button>
        );
      })}
    </div>
  );
}
