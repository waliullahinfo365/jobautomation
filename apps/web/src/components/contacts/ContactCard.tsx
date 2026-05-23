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
        "flex flex-col gap-3 rounded-xl border bg-[var(--surface-1)] p-4 shadow-sm transition-shadow hover:shadow-md",
        followUpDue ? "border-amber-500/40" : "border-[var(--border-default)]"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[13px] font-bold text-[var(--accent-hi)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-[var(--text-1)]">{contact.name}</p>
          <p className="mt-0.5 truncate text-[12.5px] text-[var(--text-3)]">
            {contact.role || contact.title}{contact.company ? ` · ${contact.company}` : ""}
          </p>
        </div>
        <ContactRelationshipBadge relationship={contact.relationship} />
      </div>

      {/* Related job */}
      {relatedJob && (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-[12px] text-[var(--text-3)]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-hi)]" />
          <span className="truncate">{relatedJob.position} at {relatedJob.company}</span>
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center justify-between gap-1 text-[11.5px] text-[var(--text-4)]">
        <span>Last contact: {timeAgoShort(contact.lastContacted ?? contact.lastContactedAt)}</span>
        {contact.followUpStatus !== "Not Needed" && (
          <ContactFollowUpStatusBadge status={contact.followUpStatus} />
        )}
      </div>

      {/* Actions */}
      {(onView || onMarkFollowedUp) && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {onView && (
            <Button size="sm" variant="outline" className="flex-1 text-[12px]" onClick={() => onView(contact)}>
              View
            </Button>
          )}
          {followUpDue && onMarkFollowedUp && (
            <Button
              size="sm"
              className="flex-1 bg-amber-500/15 text-amber-700 text-[12px] hover:bg-amber-500/25 border-0"
              onClick={() => onMarkFollowedUp(contact.id)}
            >
              Mark contacted
            </Button>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border-default)] px-3 text-[12px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
            >
              Email
            </a>
          )}
        </div>
      )}
    </div>
  );
}
