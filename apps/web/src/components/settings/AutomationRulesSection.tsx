import type { AutomationRules } from "@/types/settings";
import { SettingSectionCard } from "./SettingSectionCard";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/i18n/useTranslation";

interface AutomationRulesSectionProps {
  rules: AutomationRules;
  onChange: (next: AutomationRules) => void;
}

export function AutomationRulesSection({ rules, onChange }: AutomationRulesSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <SettingSectionCard title={t("settings.automationRules.duplicateDetection.title")}>
        <Row label={t("settings.automationRules.duplicateDetection.matchByCompanyPositionUrl")}>
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
          options={[
            { label: t("settings.automationRules.duplicateDetection.mode.strict"), value: "Strict" },
            { label: t("settings.automationRules.duplicateDetection.mode.balanced"), value: "Balanced" },
            { label: t("settings.automationRules.duplicateDetection.mode.loose"), value: "Loose" },
          ]}
        />
      </SettingSectionCard>

      <SettingSectionCard title={t("settings.automationRules.followUp.title")}>
        <Row label={t("settings.automationRules.followUp.daysAfterApply")}>
          <Input type="number" value={rules.followUpReminder.defaultFollowUpDays} onChange={(e) => onChange({ ...rules, followUpReminder: { ...rules.followUpReminder, defaultFollowUpDays: Number(e.target.value) || 0 } })} />
        </Row>
        <Row label={t("settings.automationRules.followUp.time")}>
          <Input type="time" value={rules.followUpReminder.reminderTime} onChange={(e) => onChange({ ...rules, followUpReminder: { ...rules.followUpReminder, reminderTime: e.target.value } })} />
        </Row>
        <Row label={t("settings.automationRules.followUp.autoMarkSent")}>
          <Switch checked={rules.followUpReminder.autoMarkReminderSent} onCheckedChange={(checked) => onChange({ ...rules, followUpReminder: { ...rules.followUpReminder, autoMarkReminderSent: checked } })} />
        </Row>
      </SettingSectionCard>

      <SettingSectionCard title={t("settings.automationRules.deadline.title")}>
        <Row label={t("settings.automationRules.deadline.daysBeforeDeadline")}>
          <Input type="number" value={rules.deadlineAlert.warnBeforeDays} onChange={(e) => onChange({ ...rules, deadlineAlert: { ...rules.deadlineAlert, warnBeforeDays: Number(e.target.value) || 0 } })} />
        </Row>
        <Row label={t("settings.automationRules.deadline.activeJobsOnly")}>
          <Switch checked={rules.deadlineAlert.includeOnlyActiveJobs} onCheckedChange={(checked) => onChange({ ...rules, deadlineAlert: { ...rules.deadlineAlert, includeOnlyActiveJobs: checked } })} />
        </Row>
      </SettingSectionCard>

      <SettingSectionCard title={t("settings.automationRules.lifecycle.title")}>
        <Row label={t("settings.automationRules.lifecycle.staleAfterDays")}>
          <Input type="number" value={rules.lifecycleMonitoring.archiveStaleNewJobsAfterDays} onChange={(e) => onChange({ ...rules, lifecycleMonitoring: { ...rules.lifecycleMonitoring, archiveStaleNewJobsAfterDays: Number(e.target.value) || 0 } })} />
        </Row>
        <Row label={t("settings.automationRules.lifecycle.criticalAfterDays")}>
          <Input type="number" value={rules.lifecycleMonitoring.archiveStaleAppliedJobsAfterDays} onChange={(e) => onChange({ ...rules, lifecycleMonitoring: { ...rules.lifecycleMonitoring, archiveStaleAppliedJobsAfterDays: Number(e.target.value) || 0 } })} />
        </Row>
      </SettingSectionCard>

      <SettingSectionCard title={t("settings.automationRules.dailyDigest.title")}>
        <Row label={t("settings.automationRules.dailyDigest.sendDailyDigest")}>
          <Switch checked={rules.dailyDigest.enabled} onCheckedChange={(checked) => onChange({ ...rules, dailyDigest: { ...rules.dailyDigest, enabled: checked } })} />
        </Row>
        <Row label={t("settings.automationRules.dailyDigest.time")}>
          <Input type="time" value={rules.dailyDigest.time} onChange={(e) => onChange({ ...rules, dailyDigest: { ...rules.dailyDigest, time: e.target.value } })} />
        </Row>
      </SettingSectionCard>

      <SettingSectionCard title={t("settings.automationRules.weeklyReport.title")}>
        <Row label={t("settings.automationRules.weeklyReport.sendWeeklyReport")}>
          <Switch checked={rules.weeklyReport.enabled} onCheckedChange={(checked) => onChange({ ...rules, weeklyReport: { ...rules.weeklyReport, enabled: checked } })} />
        </Row>
        <Select
          value={rules.weeklyReport.day}
          onChange={(e) => onChange({ ...rules, weeklyReport: { ...rules.weeklyReport, day: e.target.value } })}
          options={[
            { label: t("settings.automationRules.days.monday"), value: "Monday" },
            { label: t("settings.automationRules.days.tuesday"), value: "Tuesday" },
            { label: t("settings.automationRules.days.wednesday"), value: "Wednesday" },
            { label: t("settings.automationRules.days.thursday"), value: "Thursday" },
            { label: t("settings.automationRules.days.friday"), value: "Friday" },
            { label: t("settings.automationRules.days.saturday"), value: "Saturday" },
            { label: t("settings.automationRules.days.sunday"), value: "Sunday" },
          ]}
        />
        <Row label={t("settings.automationRules.weeklyReport.time")}>
          <Input type="time" value={rules.weeklyReport.time} onChange={(e) => onChange({ ...rules, weeklyReport: { ...rules.weeklyReport, time: e.target.value } })} />
        </Row>
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
