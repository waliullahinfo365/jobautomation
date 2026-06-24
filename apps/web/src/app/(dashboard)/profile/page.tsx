"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { SettingsIcon } from "@/components/icons";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ChangePasswordModal } from "@/components/profile/ChangePasswordModal";
import { me } from "@/lib/api/auth.api";
import { useTranslation } from "@/i18n/useTranslation";

type ProfileState = {
  name: string;
  email: string;
  workspaceName: string;
  role: string;
  status: string;
};

const FALLBACK_PROFILE: ProfileState = {
  name: "Current User",
  email: "Signed in account",
  workspaceName: "Current Workspace",
  role: "Workspace member",
  status: "Active",
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileState>(FALLBACK_PROFILE);
  const [loading, setLoading] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await me();
        if (!mounted) return;
        setProfile({
          name: data.user?.name || FALLBACK_PROFILE.name,
          email: data.user?.email || FALLBACK_PROFILE.email,
          workspaceName: data.tenant?.name || FALLBACK_PROFILE.workspaceName,
          role: data.user?.role || FALLBACK_PROFILE.role,
          status: data.user?.status || FALLBACK_PROFILE.status,
        });
      } catch {
        if (!mounted) return;
        setProfile(FALLBACK_PROFILE);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SettingsIcon}
        eyebrow={t("profile.eyebrow")}
        title={t("profile.title")}
        description={t("profile.description")}
      />

      <SectionCard title={t("profile.details")}>
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <InfoRow label={t("profile.userName")} value={loading ? t("common.loading") : profile.name} />
          <InfoRow label={t("profile.email")} value={loading ? t("common.loading") : profile.email} />
          <InfoRow label={t("profile.workspaceName")} value={loading ? t("common.loading") : profile.workspaceName} />
          <InfoRow label={t("profile.role")} value={loading ? t("common.loading") : profile.role} />
          <InfoRow label={t("profile.accountStatus")} value={loading ? t("common.loading") : profile.status} />
        </div>
      </SectionCard>

      <SectionCard title={t("profile.integrationsSummary")}>
        <p className="text-sm text-[var(--text-2)]">
          {t("profile.integrationsPlaceholder")}
        </p>
      </SectionCard>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" className="w-full sm:w-auto" onClick={() => setIsEditProfileOpen(true)}>
          {t("profile.editProfile")}
        </Button>
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsChangePasswordOpen(true)}>
          {t("profile.changePassword")}
        </Button>
        <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => router.push("/settings")}>
          {t("profile.backToSettings")}
        </Button>
      </div>

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentProfile={{
          name: profile.name,
          email: profile.email,
          workspaceName: profile.workspaceName,
        }}
        onSave={(updatedProfile) => {
          setProfile((prev) => ({
            ...prev,
            ...updatedProfile,
          }));
        }}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--r-sm)] border border-[var(--border-default)] bg-[var(--surface-2)] p-3">
      <p className="text-xs font-medium text-[var(--text-3)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-1)]">{value}</p>
    </div>
  );
}
