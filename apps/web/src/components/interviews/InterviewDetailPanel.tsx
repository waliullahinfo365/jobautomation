"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { formatDate } from "@/lib/utils";
import type { Interview } from "@/types/interview";
import { InterviewTypeBadge } from "./InterviewTypeBadge";
import { InterviewStatusBadge } from "./InterviewStatusBadge";
import { InterviewPrepChecklist } from "./InterviewPrepChecklist";
import { InterviewTimeline } from "./InterviewTimeline";
import { InterviewAutomationLogs } from "./InterviewAutomationLogs";

export function InterviewDetailPanel({
  interview,
  open,
  onClose,
  onCreateCalendarEvent,
  onMarkComplete,
  pendingAction,
}: {
  interview: Interview | null;
  open: boolean;
  onClose: () => void;
  onCreateCalendarEvent?: () => void | Promise<void>;
  onMarkComplete?: () => void | Promise<void>;
  pendingAction?: string | null;
}) {
  return (
    <AnimatePresence>
      {open && interview ? (
        <div className="fixed inset-0 z-50 flex">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 bg-black/40" onClick={onClose} />
          <motion.aside
            initial={{ x: 36, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-card/95 p-6 backdrop-blur-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{interview.company}</h2>
                <p className="text-sm text-muted-foreground">{interview.position}</p>
                <div className="mt-2 flex gap-2">
                  <InterviewTypeBadge type={interview.interviewType} />
                  <InterviewStatusBadge status={interview.status} />
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <CloseIcon size={20} />
              </Button>
            </div>

            <div className="space-y-5">
              <SectionCard title="Interview Details">
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <Info label="Date/time" value={formatDate(interview.dateTime, "MMM d, yyyy HH:mm")} />
                  <Info label="Duration" value={`${interview.durationMinutes} minutes`} />
                  <Info label="Interviewer" value={`${interview.interviewerName} (${interview.interviewerRole})`} />
                  <Info label="Contact email" value={interview.contactEmail} />
                  <Info label="Meeting link" value={interview.meetingLink} />
                  <Info label="Location" value={interview.location} />
                  <Info label="Calendar event ID" value={interview.calendarEventId} />
                  <Info label="Related job/application" value={`${interview.jobId} / ${interview.applicationId}`} />
                </div>
              </SectionCard>

              {(onCreateCalendarEvent || onMarkComplete) && (
                <SectionCard title="Actions">
                  <div className="flex flex-wrap gap-2">
                    {onCreateCalendarEvent ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={!!pendingAction}
                        onClick={() => void onCreateCalendarEvent()}
                      >
                        Create Calendar Event
                      </Button>
                    ) : null}
                    {onMarkComplete ? (
                      <Button type="button" size="sm" variant="outline" disabled={!!pendingAction} onClick={() => void onMarkComplete()}>
                        Mark Complete
                      </Button>
                    ) : null}
                  </div>
                </SectionCard>
              )}

              <SectionCard title="Prep Checklist">
                <InterviewPrepChecklist items={interview.prepChecklist} />
              </SectionCard>

              <SectionCard title="Notes">
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground"><span className="font-medium text-foreground">Notes summary:</span> {interview.notesSummary}</p>
                  <p className="text-muted-foreground"><span className="font-medium text-foreground">AI prep summary:</span> {interview.aiPrepSummary}</p>
                  <p className="rounded-md bg-muted/70 p-2 text-muted-foreground"><span className="font-medium text-foreground">Follow-up preview:</span> {interview.followUpMessagePreview}</p>
                </div>
              </SectionCard>

              <SectionCard title="Timeline">
                <InterviewTimeline events={interview.timeline} />
              </SectionCard>

              <InterviewAutomationLogs logs={interview.automationLogs} />
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
