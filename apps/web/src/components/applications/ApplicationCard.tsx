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
        "flex flex-col gap-3 rounded-xl border bg-[var(--surface-1)] p-4 shadow-sm transition-shadow hover:shadow-md",
        followUpDue ? "border-amber-500/40" : "border-[var(--border-default)]"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-[var(--text-1)]">{app.position}</p>
          <p className="mt-0.5 text-[12.5px] text-[var(--text-3)]">{app.company}</p>
        </div>
        <ApplicationStatusBadge status={app.applicationStatus} />
      </div>

      {/* Next action */}
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

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--text-4)]">
        {app.dateApplied && (
          <span>Applied {timeAgoShort(app.dateApplied)}</span>
        )}
        {app.source && <span>· {app.source}</span>}
        {app.followUpStatus !== "Not Needed" && (
          <span className="ml-auto">
            <FollowUpStatusBadge status={app.followUpStatus} />
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-[12px]"
          onClick={() => onView(app)}
        >
          View
        </Button>
        {followUpDue && (
          <Button
            size="sm"
            className="flex-1 bg-amber-500/15 text-amber-700 text-[12px] hover:bg-amber-500/25 border-0"
            onClick={() => onMarkFollowUpSent(app.id)}
          >
            Mark follow-up sent
          </Button>
        )}
        {app.contactEmail && (
          <a
            href={
              app.providerThreadId
                ? `https://mail.google.com/mail/u/0/#inbox/${app.providerThreadId}`
                : `mailto:${app.contactEmail}`
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-[var(--border-default)] px-3 text-[12px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
          >
            Email
          </a>
        )}
      </div>
    </div>
  );
}
