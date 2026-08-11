"use client";

import Link from "next/link";
import type { SettingsSection } from "@/types/settings";
import { SETTINGS_SECTION_I18N_KEY } from "@/i18n/settings-sections";
import { useTranslation } from "@/i18n/useTranslation";
import { settingsSectionHref } from "@/lib/settings-routing";
import { cn } from "@/lib/utils";

interface SettingsNavigationProps {
  sections: SettingsSection[];
  activeSection: SettingsSection;
}

const PRIMARY_SECTIONS: SettingsSection[] = ["Profile", "Integrations", "Notifications", "Billing"];
const ADVANCED_SECTIONS: SettingsSection[] = ["Automation Rules", "Data & Storage", "Security"];

export function SettingsNavigation({ sections, activeSection }: SettingsNavigationProps) {
  const { t } = useTranslation();

  const primary = sections.filter((s) => PRIMARY_SECTIONS.includes(s));
  const advanced = sections.filter((s) => ADVANCED_SECTIONS.includes(s));

  const renderLink = (section: SettingsSection) => (
    <Link
      key={section}
      href={settingsSectionHref(section)}
      scroll={false}
      replace
      className={cn(
        "block w-full rounded-xl px-3.5 py-3 text-left text-[13.5px] font-medium transition-colors min-h-[44px]",
        activeSection === section
          ? "bg-[var(--accent-bg)] text-[var(--accent-hi)] shadow-sm"
          : "text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
      )}
    >
      {t(SETTINGS_SECTION_I18N_KEY[section])}
    </Link>
  );

  return (
    <nav
      aria-label={t("settings.simpleTitle")}
      className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-2.5 shadow-sm"
    >
      <div className="space-y-1">
        {primary.map(renderLink)}
        {advanced.length > 0 ? (
          <>
            <div className="px-3 pb-1 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-4)]">Advanced</p>
            </div>
            {advanced.map(renderLink)}
          </>
        ) : null}
      </div>
    </nav>
  );
}
