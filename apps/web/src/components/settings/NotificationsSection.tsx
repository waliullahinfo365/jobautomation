import type { NotificationPreferences } from "@/types/settings";
import { SettingSectionCard } from "./SettingSectionCard";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/i18n/useTranslation";
import { PushNotificationPrompt } from "@/components/shared/PushNotificationPrompt";

interface NotificationsSectionProps {
  preferences: NotificationPreferences;
  onChange: (next: NotificationPreferences) => void;
  variant?: "simple" | "advanced";
}

// Map event display names to translation keys
const EVENT_TRANSLATION_MAP: Record<string, string> = {
  "New job detected": "settings.notifications.events.newJobDetected",
  "Duplicate skipped": "settings.notifications.events.duplicateSkipped",
  "Application ready": "settings.notifications.events.applicationReady",
  "Follow-up due": "settings.notifications.events.followUpDue",
  "Reply received": "settings.notifications.events.replyReceived",
  "Interview scheduled": "settings.notifications.events.interviewScheduled",
  "Offer detected": "settings.notifications.events.offerDetected",
  "Deadline approaching": "settings.notifications.events.deadlineApproaching",
  "Automation failed": "settings.notifications.events.automationFailed",
  "Daily digest": "settings.notifications.events.dailyDigest",
  "Weekly report": "settings.notifications.events.weeklyReport",
};

export function NotificationsSection({ preferences, onChange, variant = "advanced" }: NotificationsSectionProps) {
  const { t } = useTranslation();
  const simple = variant === "simple";
  const hiddenEvents = simple
    ? new Set(["Duplicate skipped", "Automation failed", "Daily digest", "Weekly report"])
    : null;

  return (
    <div className="space-y-4">
      <PushNotificationPrompt />
      <SettingSectionCard title={t("settings.notifications.channels.title")}>
        <ChannelRow label={t("settings.notifications.channels.email")} checked={preferences.channels.email} onChange={(checked) => onChange({ ...preferences, channels: { ...preferences.channels, email: checked } })} />
        <ChannelRow label={t("settings.notifications.channels.dashboard")} checked={preferences.channels.dashboard} onChange={(checked) => onChange({ ...preferences, channels: { ...preferences.channels, dashboard: checked } })} />
        {!simple ? (
          <ChannelRow label={t("settings.notifications.channels.slack")} checked={preferences.channels.slack} onChange={(checked) => onChange({ ...preferences, channels: { ...preferences.channels, slack: checked } })} />
        ) : null}
      </SettingSectionCard>

      <SettingSectionCard title={t("settings.notifications.events.title")}>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {Object.entries(preferences.events)
            .filter(([event]) => !hiddenEvents?.has(event))
            .map(([event, enabled]) => {
            const translationKey = EVENT_TRANSLATION_MAP[event];
            const label = translationKey ? t(translationKey) : event;
            
            return (
              <div key={event} className="flex items-center gap-2 rounded-md border border-[var(--border-default)] p-2">
                <Checkbox checked={enabled} onCheckedChange={(checked) => onChange({ ...preferences, events: { ...preferences.events, [event]: checked } })} />
                <span className="text-sm text-[var(--text-2)]">{label}</span>
              </div>
            );
          })}
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
