"use client";

import type { Contact } from "@/types/contact";
import { ContactRelationshipBadge } from "./ContactRelationshipBadge";
import { ContactFollowUpStatusBadge } from "./ContactFollowUpStatusBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContactCardProps {
  contact: Contact;
  onView?: (contact: Contact) => void;
  onMarkFollowedUp?: (id: string) => void;
}

function timeAgoShort(d: Date | string | undefined): string {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function ContactCard({ contact, onView, onMarkFollowedUp }: ContactCardProps) {
  const followUpDue = contact.followUpStatus === "Due Today" || contact.followUpStatus === "Overdue";
  const relatedJob = contact.relatedJobs?.[0];
  const initials = `${contact.firstName?.[0] ?? ""}${contact.lastName?.[0] ?? ""}`.toUpperCase() || contact.name?.[0]?.toUpperCase() || "?";

  return (
    <div
      className={cn(
        "mobile-list-card flex flex-col gap-3 rounded-xl border bg-[var(--surface-1)] p-4 shadow-sm transition-shadow hover:shadow-md",
        followUpDue ? "border-amber-500/40" : "border-[var(--border-default)]"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[13px] font-bold text-[var(--accent-hi)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-[var(--text-1)]">{contact.name}</p>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--text-3)]">
            {contact.role || contact.title}{contact.company ? ` · ${contact.company}` : ""}
          </p>
        </div>
        <ContactRelationshipBadge relationship={contact.relationship} />
      </div>

      {relatedJob ? (
        <div className="flex min-w-0 items-center gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-[12px] text-[var(--text-3)]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-hi)]" />
          <span className="min-w-0 break-words">{relatedJob.position} at {relatedJob.company}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-[var(--text-4)]">
        <span>Last contact: {timeAgoShort(contact.lastContacted ?? contact.lastContactedAt)}</span>
        {contact.followUpStatus !== "Not Needed" ? <ContactFollowUpStatusBadge status={contact.followUpStatus} /> : null}
      </div>

      {(onView || onMarkFollowedUp) ? (
        <div className="mobile-card-actions pt-1">
          {onView ? (
            <Button size="sm" variant="outline" className="min-h-[44px] text-[12px]" onClick={() => onView(contact)}>
              View
            </Button>
          ) : null}
          {followUpDue && onMarkFollowedUp ? (
            <Button
              size="sm"
              className="min-h-[44px] border-0 bg-amber-500/15 text-[12px] text-amber-700 hover:bg-amber-500/25"
              onClick={() => onMarkFollowedUp(contact.id)}
            >
              Mark contacted
            </Button>
          ) : null}
          {contact.email ? (
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--border-default)] px-3 text-center text-[12px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
            >
              Email
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
