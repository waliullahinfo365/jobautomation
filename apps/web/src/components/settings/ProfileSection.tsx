"use client";

import type { ProfileSettings } from "@/types/settings";
import { SettingSectionCard } from "./SettingSectionCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTranslation } from "@/i18n/useTranslation";
import type { Locale } from "@/i18n/translations";

interface ProfileSectionProps {
  profile: ProfileSettings;
  onChange: (next: ProfileSettings) => void;
}

export function ProfileSection({ profile, onChange }: ProfileSectionProps) {
  const { t, locale, setLocale } = useTranslation();

  return (
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
          <p className="mt-2 text-xs text-[var(--text-4)]">{t("profile.documentLanguageNote")}</p>
        </div>

        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{profile.avatarInitials}</AvatarFallback>
          </Avatar>
          <p className="text-sm text-[var(--text-2)]">Avatar placeholder</p>
        </div>
        <Input value={profile.name} onChange={(e) => onChange({ ...profile, name: e.target.value })} placeholder="Name" />
        <Input value={profile.email} onChange={(e) => onChange({ ...profile, email: e.target.value })} placeholder="Email" />
        <Input
          value={profile.workspaceName}
          onChange={(e) => onChange({ ...profile, workspaceName: e.target.value })}
          placeholder="Workspace name"
        />
        <Input value={profile.role} onChange={(e) => onChange({ ...profile, role: e.target.value })} placeholder="Role" />
        <Select
          value={profile.timezone}
          onChange={(e) => onChange({ ...profile, timezone: e.target.value })}
          options={[
            { label: "Asia/Karachi (UTC+5)", value: "Asia/Karachi (UTC+5)" },
            { label: "UTC", value: "UTC" },
            { label: "America/New_York (UTC-5)", value: "America/New_York (UTC-5)" },
          ]}
        />
      </div>
    </SettingSectionCard>
  );
}
