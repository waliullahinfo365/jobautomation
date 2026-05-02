import type { NotificationPreferences } from "@/types/settings";
import { SettingSectionCard } from "./SettingSectionCard";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface NotificationsSectionProps {
  preferences: NotificationPreferences;
  onChange: (next: NotificationPreferences) => void;
}

export function NotificationsSection({ preferences, onChange }: NotificationsSectionProps) {
  return (
    <div className="space-y-4">
      <SettingSectionCard title="Notification Channels">
        <ChannelRow label="Email" checked={preferences.channels.email} onChange={(checked) => onChange({ ...preferences, channels: { ...preferences.channels, email: checked } })} />
        <ChannelRow label="Dashboard" checked={preferences.channels.dashboard} onChange={(checked) => onChange({ ...preferences, channels: { ...preferences.channels, dashboard: checked } })} />
        <ChannelRow label="Slack (placeholder)" checked={preferences.channels.slack} onChange={(checked) => onChange({ ...preferences, channels: { ...preferences.channels, slack: checked } })} />
      </SettingSectionCard>

      <SettingSectionCard title="Event Preferences">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {Object.entries(preferences.events).map(([event, enabled]) => (
            <div key={event} className="flex items-center gap-2 rounded-md border border-[var(--border-default)] p-2">
              <Checkbox checked={enabled} onCheckedChange={(checked) => onChange({ ...preferences, events: { ...preferences.events, [event]: checked } })} />
              <span className="text-sm text-[var(--text-2)]">{event}</span>
            </div>
          ))}
        </div>
      </SettingSectionCard>
    </div>
  );
}

function ChannelRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <p className="text-sm text-[var(--text-2)]">{label}</p>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
