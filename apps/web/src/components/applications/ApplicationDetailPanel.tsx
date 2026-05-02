"use client";

import { CloseIcon } from "@/components/icons";
import type { Application } from "@/types/application";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { ResponseStatusBadge } from "./ResponseStatusBadge";
import { FollowUpStatusBadge } from "./FollowUpStatusBadge";
import { ApplicationTimeline } from "./ApplicationTimeline";
import { ApplicationAutomationLogList } from "./ApplicationAutomationLog";
import { SectionCard } from "@/components/shared/SectionCard";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

interface ApplicationDetailPanelProps {
  application: Application | null;
  open: boolean;
  onClose: () => void;
  onMarkApplied?: () => void | Promise<void>;
  onScheduleFollowUp?: () => void | Promise<void>;
  onMarkFollowUpSent?: () => void | Promise<void>;
  onSimulateReply?: () => void | Promise<void>;
  pendingAction?: string | null;
}

export function ApplicationDetailPanel({
  application,
  open,
  onClose,
  onMarkApplied,
  onScheduleFollowUp,
  onMarkFollowUpSent,
  onSimulateReply,
  pendingAction,
}: ApplicationDetailPanelProps) {
  return (
    <AnimatePresence>
      {open && application ? (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 bg-black/40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-card p-6"
          >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--text-3)]">{application.company}</p>
            <h2 className="text-xl font-semibold text-[var(--text-1)]">{application.position}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <ApplicationStatusBadge status={application.applicationStatus} />
              <ResponseStatusBadge status={application.responseStatus} />
              <FollowUpStatusBadge status={application.followUpStatus} />
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <CloseIcon size={20} />
          </Button>
        </div>

        <div className="space-y-5">
          <SectionCard title="Application Summary">
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <Info label="Source" value={application.source} />
              <Info label="Date Found" value={formatDate(application.dateFound)} />
              <Info label="Date Applied" value={application.dateApplied ? formatDate(application.dateApplied) : "—"} />
              <Info label="Follow-up Date" value={application.followUpDate ? formatDate(application.followUpDate) : "—"} />
              <Info label="Contact Email" value={application.contactEmail} />
              <Info
                label="Job URL"
                value={
                  <a href={application.jobUrl} target="_blank" rel="noreferrer" className="text-[var(--text-2)] hover:underline">
                    Open posting
                  </a>
                }
              />
            </div>
          </SectionCard>

          <SectionCard title="Email & Reply Status">
            <div className="space-y-2 text-sm">
              <Info label="Last Email Subject" value={application.lastEmailSubject || "—"} />
              <Info label="Last Reply Snippet" value={application.lastReplySnippet || "—"} />
              <Info label="Response Detected" value={application.responseDetected ? "Yes" : "No"} />
              <Info label="AI Classification" value={application.aiClassification} />
            </div>
          </SectionCard>

          <SectionCard title="Follow-up Info">
            <div className="space-y-2 text-sm">
              <Info label="Follow-up Message Preview" value={application.followUpMessagePreview || "—"} />
              <Info label="Reminder Status" value={application.reminderStatus} />
              <Info label="Reminder Sent Date" value={application.reminderSentDate ? formatDate(application.reminderSentDate) : "—"} />
            </div>
          </SectionCard>

          {(onMarkApplied || onScheduleFollowUp || onMarkFollowUpSent || onSimulateReply) && (
            <SectionCard title="Actions">
              <div className="flex flex-wrap gap-2">
                {onMarkApplied ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!!pendingAction}
                    onClick={() => void onMarkApplied()}
                  >
                    Mark Applied
                  </Button>
                ) : null}
                {onScheduleFollowUp ? (
                  <Button type="button" size="sm" variant="outline" disabled={!!pendingAction} onClick={() => void onScheduleFollowUp()}>
                    Schedule Follow-Up
                  </Button>
                ) : null}
                {onMarkFollowUpSent ? (
                  <Button type="button" size="sm" variant="outline" disabled={!!pendingAction} onClick={() => void onMarkFollowUpSent()}>
                    Mark Follow-Up Sent
                  </Button>
                ) : null}
                {onSimulateReply ? (
                  <Button type="button" size="sm" variant="ghost" disabled={!!pendingAction} onClick={() => void onSimulateReply()}>
                    Simulate Reply
                  </Button>
                ) : null}
              </div>
            </SectionCard>
          )}

          <SectionCard title="Timeline">
            <ApplicationTimeline timeline={application.timeline} />
          </SectionCard>

          <SectionCard title="Automation Log">
            <ApplicationAutomationLogList logs={application.automationLogs} />
          </SectionCard>
        </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="font-medium text-[var(--text-1)]">{value}</p>
    </div>
  );
}
