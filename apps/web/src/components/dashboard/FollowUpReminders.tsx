"use client";

import { ContactsIcon, FollowUpIcon } from "@/components/icons";
import type { FollowUpReminderItem } from "@/data/mockApplications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";
import { formatDateShortMonthWithTimeLocale } from "@/lib/format-date-locale";

interface FollowUpRemindersProps {
  reminders: FollowUpReminderItem[];
}

const statusClass: Record<FollowUpReminderItem["reminderStatus"], string> = {
  "Due Today": "bg-[var(--amber-bg)] text-[var(--amber)]",
  Scheduled: "bg-[var(--accent-bg)] text-[var(--accent-hi)]",
  Overdue: "bg-[var(--rose-bg)] text-[var(--rose)]",
};

function reminderStatusKey(status: FollowUpReminderItem["reminderStatus"]): string {
  switch (status) {
    case "Due Today":
      return "dashboard.followUpReminders.dueToday";
    case "Scheduled":
      return "dashboard.followUpReminders.scheduled";
    case "Overdue":
      return "dashboard.followUpReminders.overdue";
    default:
      return "dashboard.followUpReminders.scheduled";
  }
}

export function FollowUpReminders({ reminders }: FollowUpRemindersProps) {
  const { t, locale } = useTranslation();

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <FollowUpIcon size={16} className="text-[var(--text-3)]" />
        <CardTitle>{t("dashboard.followUpReminders.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {reminders.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-4 rounded-lg px-3 py-2.5 hover:bg-[var(--surface-3)]"
          >
            <div>
              <p className="text-sm font-medium text-[var(--text-1)]">{item.company}</p>
              <p className="text-xs text-[var(--text-3)]">{item.position}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-3)]">
                <ContactsIcon size={14} className="inline shrink-0 opacity-80" /> {item.contactEmail}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-3)]">
                {formatDateShortMonthWithTimeLocale(item.followUpDate, locale)}
              </p>
              <Badge className={`mt-1 ${statusClass[item.reminderStatus]}`}>{t(reminderStatusKey(item.reminderStatus))}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
