"use client";

import type { ProfileSettings } from "@/types/settings";
import { SettingSectionCard } from "./SettingSectionCard";
import { AutoApplyProfileCard } from "./AutoApplyProfileCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { useTheme } from "next-themes";
import type { Locale } from "@/i18n/translations";

interface ProfileSectionProps {
  profile: ProfileSettings;
  onChange: (next: ProfileSettings) => void;
  variant?: "simple" | "advanced";
}

export function ProfileSection({ profile, onChange, variant = "advanced" }: ProfileSectionProps) {
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const simple = variant === "simple";
  const isDark = (resolvedTheme ?? theme ?? "light") === "dark";

  return (
    <div className="space-y-6">
    <SettingSectionCard title={t("settings.section.profile")} description={t("profile.description")}>
      <div className="space-y-4">
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
          <p className="text-xs font-medium text-[var(--text-3)]">{t("settings.profileLanguage")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              options={[
                { label: t("settings.profileLanguageDe"), value: "de" },
                { label: t("settings.profileLanguageEn"), value: "en" },
              ]}
              className="max-w-xs"
            />
          </div>
          {!simple ? (
            <p className="mt-2 text-xs text-[var(--text-4)]">{t("profile.documentLanguageNote")}</p>
          ) : null}
        </div>

        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
          <p className="text-xs font-medium text-[var(--text-3)]">{t("settings.appearanceTitle")}</p>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant={!isDark ? "default" : "outline"}
              size="sm"
              className="min-h-[40px] flex-1"
              onClick={() => setTheme("light")}
            >
              {t("common.lightMode")}
            </Button>
            <Button
              type="button"
              variant={isDark ? "default" : "outline"}
              size="sm"
              className="min-h-[40px] flex-1"
              onClick={() => setTheme("dark")}
            >
              {t("common.darkMode")}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{profile.avatarInitials}</AvatarFallback>
          </Avatar>
          <p className="text-sm text-[var(--text-2)]">{t("profile.avatarPlaceholder")}</p>
        </div>
        <Input value={profile.name} onChange={(e) => onChange({ ...profile, name: e.target.value })} placeholder={t("form.label.name")} />
        <Input value={profile.email} onChange={(e) => onChange({ ...profile, email: e.target.value })} placeholder={t("form.label.email")} />
        {!simple ? (
          <>
            <Input
              value={profile.workspaceName}
              onChange={(e) => onChange({ ...profile, workspaceName: e.target.value })}
              placeholder={t("form.label.workspaceName")}
            />
            <Input value={profile.role} onChange={(e) => onChange({ ...profile, role: e.target.value })} placeholder={t("form.label.role")} />
            <Select
              value={profile.timezone}
              onChange={(e) => onChange({ ...profile, timezone: e.target.value })}
              options={[
                { label: "Asia/Karachi (UTC+5)", value: "Asia/Karachi (UTC+5)" },
                { label: "UTC", value: "UTC" },
                { label: "America/New_York (UTC-5)", value: "America/New_York (UTC-5)" },
              ]}
            />
          </>
        ) : null}
      </div>
    </SettingSectionCard>
    {!simple ? <AutoApplyProfileCard /> : null}
    </div>
  );
}
