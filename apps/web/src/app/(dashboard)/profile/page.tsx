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
        eyebrow="Account"
        title="Account / Profile"
        description="Review your account details and workspace membership."
      />

      <SectionCard title="Profile details">
        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <InfoRow label="User name" value={loading ? "Loading..." : profile.name} />
          <InfoRow label="Email" value={loading ? "Loading..." : profile.email} />
          <InfoRow label="Workspace name" value={loading ? "Loading..." : profile.workspaceName} />
          <InfoRow label="Role" value={loading ? "Loading..." : profile.role} />
          <InfoRow label="Account status" value={loading ? "Loading..." : profile.status} />
        </div>
      </SectionCard>

      <SectionCard title="Connected integrations summary">
        <p className="text-sm text-[var(--text-2)]">
          Integration summary will be expanded here with account-level visibility across Gmail, Drive, Calendar, AI, and
          communication modules.
        </p>
      </SectionCard>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setIsEditProfileOpen(true)}>
          Edit Profile
        </Button>
        <Button type="button" variant="outline" onClick={() => setIsChangePasswordOpen(true)}>
          Change Password
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/settings")}>
          Back to Settings
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
