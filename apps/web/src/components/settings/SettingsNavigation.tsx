"use client";

import type { SettingsSection } from "@/types/settings";
import { SETTINGS_SECTION_I18N_KEY } from "@/i18n/settings-sections";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollableTabBar, ScrollableTabButton } from "@/components/shared/ScrollableTabBar";

interface SettingsNavigationProps {
  sections: SettingsSection[];
  activeSection: SettingsSection;
  onChange: (section: SettingsSection) => void;
}

const PRIMARY_SECTIONS: SettingsSection[] = ["Profile", "Integrations", "Notifications", "Billing"];
const ADVANCED_SECTIONS: SettingsSection[] = ["Automation Rules", "Data & Storage", "Security"];

export function SettingsNavigation({ sections, activeSection, onChange }: SettingsNavigationProps) {
  const { t } = useTranslation();

  const primary = sections.filter((s) => PRIMARY_SECTIONS.includes(s));
  const advanced = sections.filter((s) => ADVANCED_SECTIONS.includes(s));

  const renderButton = (section: SettingsSection) => (
    <button
      key={section}
      onClick={() => onChange(section)}
      className={cn(
        "w-full rounded-md px-3 py-3 text-left text-sm transition-colors min-h-[44px]",
        activeSection === section
          ? "bg-[var(--accent-bg)] text-[var(--accent-hi)]"
          : "text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
      )}
    >
      {t(SETTINGS_SECTION_I18N_KEY[section])}
    </button>
  );

  const tabButton = (section: SettingsSection) => (
    <ScrollableTabButton
      key={section}
      onPress={() => onChange(section)}
      className={cn(
        activeSection === section
          ? "bg-[var(--surface-1)] font-medium text-[var(--text-1)] shadow-sm"
          : "text-[var(--text-3)] hover:text-[var(--text-2)]"
      )}
    >
      {t(SETTINGS_SECTION_I18N_KEY[section])}
    </ScrollableTabButton>
  );

  return (
    <>
      <div className="sticky top-0 z-20 bg-[var(--bg-0)]/95 pb-2 backdrop-blur-sm lg:hidden">
        <ScrollableTabBar wrap className="px-1">
          {sections.map(tabButton)}
        </ScrollableTabBar>
      </div>

      <Card className="hidden lg:block">
        <CardContent className="p-3">
          <nav className="space-y-1">
            {primary.map(renderButton)}
            {advanced.length > 0 && (
              <>
                <div className="pb-1 pt-3">
                  <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-4)]">
                    Advanced
                  </p>
                </div>
                {advanced.map(renderButton)}
              </>
            )}
          </nav>
        </CardContent>
      </Card>
    </>
  );
}
