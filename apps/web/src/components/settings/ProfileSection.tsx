"use client";

import type { ProfileSettings } from "@/types/settings";
import { SettingSectionCard } from "./SettingSectionCard";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { AutoApplyProfileCard } from "./AutoApplyProfileCard";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { useTheme } from "next-themes";
import type { Locale } from "@/i18n/translations";
import { isLinkedInCloudAutoApplyEnabled } from "@/lib/feature-flags";

interface ProfileSectionProps {
  profile: ProfileSettings;
  onChange: (next: ProfileSettings) => void;
  onAvatarUpdated?: (avatarUrl?: string) => void;
  variant?: "simple" | "advanced";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[12px] font-medium text-[var(--text-3)]">{children}</label>;
}

export function ProfileSection({ profile, onChange, onAvatarUpdated, variant = "advanced" }: ProfileSectionProps) {
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const simple = variant === "simple";
  const isDark = (resolvedTheme ?? theme ?? "light") === "dark";

  return (
    <div className="space-y-5 lg:space-y-6">
      <SettingSectionCard title={t("settings.section.profile")} description={t("profile.description")}>
        <div className="space-y-6">
          {/* Identity row — uses full content width */}
          <div className="grid gap-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4 sm:p-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-8 lg:p-6">
            <ProfilePhotoUpload
              name={profile.name}
              avatarUrl={profile.avatarUrl}
              avatarInitials={profile.avatarInitials}
              embedded
              onUpdated={(avatarUrl) => {
                onChange({ ...profile, avatarUrl });
                onAvatarUpdated?.(avatarUrl);
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>{t("form.label.name")}</FieldLabel>
                <Input
                  value={profile.name}
                  onChange={(e) => onChange({ ...profile, name: e.target.value })}
                  placeholder={t("form.label.name")}
                  className="md:h-11 md:min-h-[44px] md:text-sm"
                />
              </div>
              <div>
                <FieldLabel>{t("form.label.email")}</FieldLabel>
                <Input
                  value={profile.email}
                  onChange={(e) => onChange({ ...profile, email: e.target.value })}
                  placeholder={t("form.label.email")}
                  className="md:h-11 md:min-h-[44px] md:text-sm"
                />
              </div>
              {!simple ? (
                <>
                  <div>
                    <FieldLabel>{t("form.label.workspaceName")}</FieldLabel>
                    <Input
                      value={profile.workspaceName}
                      onChange={(e) => onChange({ ...profile, workspaceName: e.target.value })}
                      placeholder={t("form.label.workspaceName")}
                      className="md:h-11 md:min-h-[44px] md:text-sm"
                    />
                  </div>
                  <div>
                    <FieldLabel>{t("form.label.role")}</FieldLabel>
                    <Input
                      value={profile.role}
                      onChange={(e) => onChange({ ...profile, role: e.target.value })}
                      placeholder={t("form.label.role")}
                      className="md:h-11 md:min-h-[44px] md:text-sm"
                    />
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Preferences — two equal cards across the width */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4 sm:p-5">
              <p className="text-[13px] font-semibold text-[var(--text-1)]">{t("settings.profileLanguage")}</p>
              {!simple ? (
                <p className="mt-1 text-[12px] text-[var(--text-4)]">{t("profile.documentLanguageNote")}</p>
              ) : null}
              <div className="mt-4">
                <Select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as Locale)}
                  options={[
                    { label: t("settings.profileLanguageDe"), value: "de" },
                    { label: t("settings.profileLanguageEn"), value: "en" },
                  ]}
                  className="w-full"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4 sm:p-5">
              <p className="text-[13px] font-semibold text-[var(--text-1)]">{t("settings.appearanceTitle")}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant={!isDark ? "default" : "outline"}
                  className="min-h-[44px] flex-1"
                  onClick={() => setTheme("light")}
                >
                  {t("common.lightMode")}
                </Button>
                <Button
                  type="button"
                  variant={isDark ? "default" : "outline"}
                  className="min-h-[44px] flex-1"
                  onClick={() => setTheme("dark")}
                >
                  {t("common.darkMode")}
                </Button>
              </div>
            </div>
          </div>

          {!simple ? (
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4 sm:p-5">
              <FieldLabel>Timezone</FieldLabel>
              <Select
                value={profile.timezone}
                onChange={(e) => onChange({ ...profile, timezone: e.target.value })}
                options={[
                  { label: "Asia/Karachi (UTC+5)", value: "Asia/Karachi (UTC+5)" },
                  { label: "UTC", value: "UTC" },
                  { label: "America/New_York (UTC-5)", value: "America/New_York (UTC-5)" },
                ]}
                className="mt-1 w-full max-w-md"
              />
            </div>
          ) : null}
        </div>
      </SettingSectionCard>

      {!simple && isLinkedInCloudAutoApplyEnabled() ? <AutoApplyProfileCard /> : null}
    </div>
  );
}
