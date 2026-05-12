"use client";

import { Button } from "@/components/ui/button";
import { MotionCard } from "@/components/shared/MotionCard";
import { useTranslation } from "@/i18n/useTranslation";
import type { AwaitingConfirmationInterview } from "@/types/interview";

export function AwaitingConfirmationSection({
  items,
  onConfirm,
}: {
  items: AwaitingConfirmationInterview[];
  onConfirm: (id: string) => void;
}) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {items.map((item, index) => (
        <MotionCard key={item.id} delay={index * 0.03} className="hover-lift p-4">
          <p className="text-sm font-semibold text-foreground">{item.company}</p>
          <p className="text-xs text-muted-foreground">{item.position}</p>
          <p className="mt-2 text-xs text-muted-foreground">{t("interviews.awaiting.proposedTime")}: {dateFmt.format(new Date(item.proposedTime))}</p>
          <p className="text-xs text-muted-foreground">{t("interviews.awaiting.contact")}: {item.contact}</p>
          <p className="mt-2 text-xs text-foreground">{item.sourceEmailSubject}</p>
          <p className="mt-2 rounded-md bg-muted/70 p-2 text-xs text-muted-foreground">{item.aiDetectedIntent}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onConfirm(item.id)}>{t("interviews.awaiting.confirm")}</Button>
            <Button size="sm" variant="secondary">{t("interviews.awaiting.suggestNewTime")}</Button>
            <Button size="sm" variant="ghost">{t("interviews.awaiting.ignore")}</Button>
          </div>
        </MotionCard>
      ))}
    </div>
  );
}
