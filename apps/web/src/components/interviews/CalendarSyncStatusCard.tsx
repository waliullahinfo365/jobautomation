"use client";

import { Button } from "@/components/ui/button";
import { MotionCard } from "@/components/shared/MotionCard";
import { useTranslation } from "@/i18n/useTranslation";
import type { CalendarSyncStatus } from "@/types/interview";

export function CalendarSyncStatusCard({ status, onSyncNow }: { status: CalendarSyncStatus; onSyncNow?: () => void }) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <MotionCard className="hover-lift p-4">
      <h3 className="text-sm font-semibold text-foreground">{t("interviews.calendar.syncStatus")}</h3>
      <div className="mt-3 space-y-2 text-sm">
        <p className="text-muted-foreground">{t("interviews.calendar.googleCalendar")}: <span className="font-medium text-foreground">{status.googleCalendar}</span></p>
        <p className="text-muted-foreground">{t("interviews.calendar.lastSync")}: <span className="font-medium text-foreground">{dateFmt.format(new Date(status.lastSync))}</span></p>
        <p className="text-muted-foreground">{t("interviews.calendar.nextSync")}: <span className="font-medium text-foreground">{dateFmt.format(new Date(status.nextSync))}</span></p>
      </div>
      <Button className="mt-4 w-full" variant="outline" onClick={onSyncNow}>
        {t("interviews.calendar.syncNow")}
      </Button>
    </MotionCard>
  );
}
