"use client";

import type { Contact } from "@/types/contact";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { MotionCard } from "@/components/shared/MotionCard";
import { ContactFollowUpStatusBadge } from "./ContactFollowUpStatusBadge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";

export function FollowUpsDueSection({
  contacts,
  onMarkDone,
  onSnooze,
}: {
  contacts: Contact[];
  onMarkDone: (contactId: string) => void;
  onSnooze?: (contactId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {contacts.map((contact, index) => {
        const urgentTone =
          contact.followUpStatus === "Overdue"
            ? "border-rose-300/80 dark:border-rose-700/70"
            : contact.followUpStatus === "Due Today"
              ? "border-amber-300/80 dark:border-amber-700/70"
              : "";
        return (
          <MotionCard key={contact.id} delay={index * 0.03} className={cn("hover-lift p-4", urgentTone)}>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{contact.name}</p>
                  <ContactFollowUpStatusBadge status={contact.followUpStatus} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {contact.company} · {contact.role}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("contacts.followUps.dueLabel")}{" "}
                {contact.nextFollowUpDate ? formatDate(contact.nextFollowUpDate, "MMM d, yyyy HH:mm") : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {contact.followUpReason || t("contacts.followUps.defaultReason")}
              </p>
              <p className="rounded-md bg-muted/70 p-2 text-xs text-muted-foreground">
                {contact.followUpMessagePreview || t("contacts.followUps.noPreview")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => onMarkDone(contact.id)}>
                  {t("contacts.followUps.markDone")}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onSnooze?.(contact.id)}>
                  {t("contacts.followUps.snooze")}
                </Button>
                {contact.email ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`mailto:${contact.email}`, "_blank")}
                  >
                    {t("contacts.followUps.openEmail")}
                  </Button>
                ) : null}
              </div>
            </div>
          </MotionCard>
        );
      })}
    </div>
  );
}
