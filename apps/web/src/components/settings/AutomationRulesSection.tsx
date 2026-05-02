import type { AutomationRules } from "@/types/settings";
import { SettingSectionCard } from "./SettingSectionCard";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface AutomationRulesSectionProps {
  rules: AutomationRules;
  onChange: (next: AutomationRules) => void;
}

export function AutomationRulesSection({ rules, onChange }: AutomationRulesSectionProps) {
  return (
    <div className="space-y-4">
      <SettingSectionCard title="Duplicate Detection Rule">
        <Row label="Match by company + position + URL">
          <Switch
            checked={rules.duplicateDetection.matchByCompanyPositionUrl}
            onCheckedChange={(checked) =>
              onChange({ ...rules, duplicateDetection: { ...rules.duplicateDetection, matchByCompanyPositionUrl: checked } })
            }
          />
        </Row>
        <Select
          value={rules.duplicateDetection.matchSensitivity}
          onChange={(e) =>
            onChange({
              ...rules,
              duplicateDetection: { ...rules.duplicateDetection, matchSensitivity: e.target.value as AutomationRules["duplicateDetection"]["matchSensitivity"] },
            })
          }
          options={[{ label: "Strict", value: "Strict" }, { label: "Balanced", value: "Balanced" }, { label: "Loose", value: "Loose" }]}
        />
      </SettingSectionCard>

      <SettingSectionCard title="Follow-up Reminder Rule">
        <Input type="number" value={rules.followUpReminder.defaultFollowUpDays} onChange={(e) => onChange({ ...rules, followUpReminder: { ...rules.followUpReminder, defaultFollowUpDays: Number(e.target.value) || 0 } })} />
        <Input type="time" value={rules.followUpReminder.reminderTime} onChange={(e) => onChange({ ...rules, followUpReminder: { ...rules.followUpReminder, reminderTime: e.target.value } })} />
        <Row label="Auto-mark reminder sent">
          <Switch checked={rules.followUpReminder.autoMarkReminderSent} onCheckedChange={(checked) => onChange({ ...rules, followUpReminder: { ...rules.followUpReminder, autoMarkReminderSent: checked } })} />
        </Row>
      </SettingSectionCard>

      <SettingSectionCard title="Deadline Alert Rule">
        <Input type="number" value={rules.deadlineAlert.warnBeforeDays} onChange={(e) => onChange({ ...rules, deadlineAlert: { ...rules.deadlineAlert, warnBeforeDays: Number(e.target.value) || 0 } })} />
        <Row label="Include only active jobs">
          <Switch checked={rules.deadlineAlert.includeOnlyActiveJobs} onCheckedChange={(checked) => onChange({ ...rules, deadlineAlert: { ...rules.deadlineAlert, includeOnlyActiveJobs: checked } })} />
        </Row>
      </SettingSectionCard>

      <SettingSectionCard title="Lifecycle Monitoring Rule">
        <Input type="number" value={rules.lifecycleMonitoring.archiveStaleNewJobsAfterDays} onChange={(e) => onChange({ ...rules, lifecycleMonitoring: { ...rules.lifecycleMonitoring, archiveStaleNewJobsAfterDays: Number(e.target.value) || 0 } })} />
        <Input type="number" value={rules.lifecycleMonitoring.archiveStaleAppliedJobsAfterDays} onChange={(e) => onChange({ ...rules, lifecycleMonitoring: { ...rules.lifecycleMonitoring, archiveStaleAppliedJobsAfterDays: Number(e.target.value) || 0 } })} />
      </SettingSectionCard>

      <SettingSectionCard title="Daily Digest Rule">
        <Row label="Send daily digest">
          <Switch checked={rules.dailyDigest.enabled} onCheckedChange={(checked) => onChange({ ...rules, dailyDigest: { ...rules.dailyDigest, enabled: checked } })} />
        </Row>
        <Input type="time" value={rules.dailyDigest.time} onChange={(e) => onChange({ ...rules, dailyDigest: { ...rules.dailyDigest, time: e.target.value } })} />
      </SettingSectionCard>

      <SettingSectionCard title="Weekly Report Rule">
        <Row label="Send weekly report">
          <Switch checked={rules.weeklyReport.enabled} onCheckedChange={(checked) => onChange({ ...rules, weeklyReport: { ...rules.weeklyReport, enabled: checked } })} />
        </Row>
        <Select value={rules.weeklyReport.day} onChange={(e) => onChange({ ...rules, weeklyReport: { ...rules.weeklyReport, day: e.target.value } })} options={[{ label: "Monday", value: "Monday" }, { label: "Tuesday", value: "Tuesday" }, { label: "Friday", value: "Friday" }]} />
        <Input type="time" value={rules.weeklyReport.time} onChange={(e) => onChange({ ...rules, weeklyReport: { ...rules.weeklyReport, time: e.target.value } })} />
      </SettingSectionCard>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <p className="text-sm text-[var(--text-2)]">{label}</p>
      {children}
    </div>
  );
}
