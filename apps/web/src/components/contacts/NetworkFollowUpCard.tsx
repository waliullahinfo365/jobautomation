import { BellIcon } from "@/components/icons";
import type { Contact } from "@/types/contact";
import { formatDate, isOverdue } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MotionCard } from "@/components/shared/MotionCard";
import { ContactFollowUpStatusBadge } from "./ContactFollowUpStatusBadge";

interface NetworkFollowUpCardProps {
  contact: Contact;
  onMarkDone?: (contactId: string) => void;
}

export function NetworkFollowUpCard({ contact, onMarkDone }: NetworkFollowUpCardProps) {
  const due = contact.nextFollowUpDate || contact.followUpDue;
  const overdue = due ? isOverdue(due) : false;

  return (
    <MotionCard className={cn("hover-lift p-4", overdue ? "border-rose-300/80 dark:border-rose-700/70" : "")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BellIcon size={16} className={cn(overdue ? "text-[var(--rose)]" : "text-muted-foreground")} />
          <div>
            <p className="text-sm font-medium">{contact.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {contact.company} · Follow-up {due ? formatDate(due) : "—"}
              {overdue && " (overdue)"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ContactFollowUpStatusBadge status={contact.followUpStatus} />
          {onMarkDone ? (
            <Button onClick={() => onMarkDone(contact._id)} size="sm" variant="outline">
              Done
            </Button>
          ) : null}
        </div>
      </div>
    </MotionCard>
  );
}
