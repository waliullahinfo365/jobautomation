"use client";

import { BellIcon } from "@/components/icons";
import type { Contact } from "@/types/contact";
import { formatDate, isOverdue } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MotionCard } from "@/components/shared/MotionCard";
import { ContactFollowUpStatusBadge } from "./ContactFollowUpStatusBadge";
import { useTranslation } from "@/i18n/useTranslation";

interface NetworkFollowUpCardProps {
  contact: Contact;
  onMarkDone?: (contactId: string) => void;
}

export function NetworkFollowUpCard({ contact, onMarkDone }: NetworkFollowUpCardProps) {
  const { t } = useTranslation();
  const due = contact.nextFollowUpDate || contact.followUpDue;
  const overdue = due ? isOverdue(due) : false;

  return (
    <MotionCard className={cn("hover-lift p-4", overdue ? "border-rose-300/80 dark:border-rose-700/70" : "")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <BellIcon size={16} className={cn(overdue ? "text-[var(--rose)]" : "text-muted-foreground")} />
          <div className="min-w-0">
            <p className="text-sm font-medium">{contact.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {contact.company} · {t("contacts.networkCard.followUpPrefix")}{" "}
              {due ? formatDate(due) : "—"}
              {overdue ? ` ${t("contacts.networkCard.overdueSuffix")}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ContactFollowUpStatusBadge status={contact.followUpStatus} />
          {onMarkDone ? (
            <Button onClick={() => onMarkDone(contact._id)} size="sm" variant="outline">
              {t("contacts.networkCard.done")}
            </Button>
          ) : null}
        </div>
      </div>
    </MotionCard>
  );
}
