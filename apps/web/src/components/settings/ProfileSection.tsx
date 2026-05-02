import type { ProfileSettings } from "@/types/settings";
import { SettingSectionCard } from "./SettingSectionCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface ProfileSectionProps {
  profile: ProfileSettings;
  onChange: (next: ProfileSettings) => void;
}

export function ProfileSection({ profile, onChange }: ProfileSectionProps) {
  return (
    <SettingSectionCard title="Profile" description="Manage your account and workspace profile settings.">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{profile.avatarInitials}</AvatarFallback>
          </Avatar>
          <p className="text-sm text-[var(--text-2)]">Avatar placeholder</p>
        </div>
        <Input value={profile.name} onChange={(e) => onChange({ ...profile, name: e.target.value })} placeholder="Name" />
        <Input value={profile.email} onChange={(e) => onChange({ ...profile, email: e.target.value })} placeholder="Email" />
        <Input value={profile.workspaceName} onChange={(e) => onChange({ ...profile, workspaceName: e.target.value })} placeholder="Workspace name" />
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
