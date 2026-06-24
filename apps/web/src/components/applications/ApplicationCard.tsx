"use client";

import type { Application } from "@/types/application";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { FollowUpStatusBadge } from "./FollowUpStatusBadge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

interface ApplicationCardProps {
  application: Application;
  onView: (app: Application) => void;
  onMarkFollowUpSent: (id: string) => void;
}

function timeAgoShort(d: Date | string): string {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function getNextAction(app: Application): { label: string; urgent: boolean } {
  if (app.applicationStatus === "Interview") return { label: "Prepare for interview", urgent: true };
  if (app.followUpStatus === "Overdue") return { label: "Follow-up overdue", urgent: true };
  if (app.followUpStatus === "Due Today") return { label: "Follow up today", urgent: true };
  if (app.followUpStatus === "Scheduled") return { label: "Follow-up scheduled", urgent: false };
  if (app.applicationStatus === "Offer") return { label: "Review offer", urgent: true };
  if (app.responseStatus === "Positive Reply") return { label: "Reply received — respond", urgent: true };
  if (app.applicationStatus === "Applied") return { label: "Waiting for reply", urgent: false };
  if (app.applicationStatus === "Drafted" || app.applicationStatus === "Ready") return { label: "Ready to send", urgent: false };
  return { label: "No action needed", urgent: false };
}

export function ApplicationCard({ application: app, onView, onMarkFollowUpSent }: ApplicationCardProps) {
  const { t } = useTranslation();
  const nextAction = getNextAction(app);
  const followUpDue = app.followUpStatus === "Due Today" || app.followUpStatus === "Overdue";

  return (
    <div
      className={cn(
        "mobile-list-card flex flex-col gap-3 rounded-xl border bg-[var(--surface-1)] p-4 shadow-sm transition-shadow hover:shadow-md",
        followUpDue ? "border-amber-500/40" : "border-[var(--border-default)]"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-[var(--text-1)]">{app.position}</p>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--text-3)]">{app.company}</p>
        </div>
        <ApplicationStatusBadge status={app.applicationStatus} />
      </div>

      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium",
          nextAction.urgent
            ? "bg-amber-500/10 text-amber-700"
            : "bg-[var(--surface-2)] text-[var(--text-3)]"
        )}
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", nextAction.urgent ? "bg-amber-500" : "bg-[var(--text-4)]")} />
        {nextAction.label}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--text-4)]">
        {app.dateApplied ? <span>Applied {timeAgoShort(app.dateApplied)}</span> : null}
        {app.source ? <span>· {app.source}</span> : null}
        {app.followUpStatus !== "Not Needed" ? <FollowUpStatusBadge status={app.followUpStatus} /> : null}
      </div>

      <div className="mobile-card-actions pt-1">
        <Button size="sm" variant="outline" className="min-h-[44px] text-[12px]" onClick={() => onView(app)}>
          View
        </Button>
        {followUpDue ? (
          <Button
            size="sm"
            className="min-h-[44px] border-0 bg-amber-500/15 text-[12px] text-amber-700 hover:bg-amber-500/25"
            onClick={() => onMarkFollowUpSent(app.id)}
          >
            Mark follow-up sent
          </Button>
        ) : null}
        {app.contactEmail ? (
          <a
            href={
              app.providerThreadId
                ? `https://mail.google.com/mail/u/0/#inbox/${app.providerThreadId}`
                : `mailto:${app.contactEmail}`
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[var(--border-default)] px-3 text-center text-[12px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
          >
            Email
          </a>
        ) : null}
      </div>
    </div>
  );
}
