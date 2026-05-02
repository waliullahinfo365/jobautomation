"use client";

import type { SettingsSection } from "@/types/settings";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface SettingsNavigationProps {
  sections: SettingsSection[];
  activeSection: SettingsSection;
  onChange: (section: SettingsSection) => void;
}

export function SettingsNavigation({ sections, activeSection, onChange }: SettingsNavigationProps) {
  return (
    <Card>
      <CardContent className="p-3">
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section}
              onClick={() => onChange(section)}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                activeSection === section ? "bg-[var(--accent-bg)] text-[var(--accent-hi)]" : "text-[var(--text-2)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
              )}
            >
              {section}
            </button>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}
