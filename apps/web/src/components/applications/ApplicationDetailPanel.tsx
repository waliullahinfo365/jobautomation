"use client";

import { CloseIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";
import type { Application } from "@/types/application";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { ResponseStatusBadge } from "./ResponseStatusBadge";
import { FollowUpStatusBadge } from "./FollowUpStatusBadge";
import { ApplicationTimeline } from "./ApplicationTimeline";
import { ApplicationAutomationLogList } from "./ApplicationAutomationLog";
import { ResponsiveDetailPanel } from "@/components/shared/ResponsiveDetailPanel";
import { SectionCard } from "@/components/shared/SectionCard";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  const { t } = useTranslation();
  return (
    <ResponsiveDetailPanel open={open && !!application} onClose={onClose}>
      {application ? (
        <>
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
          <SectionCard title={t("application.summaryTitle")}>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <Info label={t("table.header.source")} value={application.source} />
              <Info label={t("table.header.dateFound")} value={formatDate(application.dateFound)} />
              <Info label={t("table.header.dateApplied")} value={application.dateApplied ? formatDate(application.dateApplied) : "—"} />
              <Info label={t("application.followUpDateLabel")} value={application.followUpDate ? formatDate(application.followUpDate) : "—"} />
              <Info label={t("application.contactEmailLabel")} value={application.contactEmail} />
              <Info
                label={t("table.header.job")}
                value={
                  <a href={application.jobUrl} target="_blank" rel="noreferrer" className="text-[var(--text-2)] hover:underline">
                    {t("application.openPosting")}
                  </a>
                }
              />
            </div>
          </SectionCard>

          <SectionCard title={t("application.emailReplyStatusTitle")}>
            <div className="space-y-2 text-sm">
              <Info label={t("application.lastEmailSubjectLabel")} value={application.lastEmailSubject || "—"} />
              <Info label={t("application.lastReplySnippetLabel")} value={application.lastReplySnippet || "—"} />
              <Info label={t("application.responseDetectedLabel")} value={application.responseDetected ? t("common.yes") : t("common.no")} />
              <Info label={t("application.aiClassificationLabel")} value={application.aiClassification} />
            </div>
          </SectionCard>

          <SectionCard title={t("application.followUpInfoTitle")}>
            <div className="space-y-2 text-sm">
              <Info label={t("application.followUpMessagePreviewLabel")} value={application.followUpMessagePreview || "—"} />
              <Info label={t("application.reminderStatusLabel")} value={application.reminderStatus} />
              <Info label={t("application.reminderSentDateLabel")} value={application.reminderSentDate ? formatDate(application.reminderSentDate) : "—"} />
            </div>
          </SectionCard>

          {(onMarkApplied || onScheduleFollowUp || onMarkFollowUpSent || onSimulateReply) && (
            <SectionCard title={t("application.actionsTitle")}>
              <div className="flex flex-wrap gap-2">
                {onMarkApplied ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!!pendingAction}
                    onClick={() => void onMarkApplied()}
                  >
                    {t("button.markApplied")}
                  </Button>
                ) : null}
                {onScheduleFollowUp ? (
                  <Button type="button" size="sm" variant="outline" disabled={!!pendingAction} onClick={() => void onScheduleFollowUp()}>
                    {t("button.scheduleFollowUp")}
                  </Button>
                ) : null}
                {onMarkFollowUpSent ? (
                  <Button type="button" size="sm" variant="outline" disabled={!!pendingAction} onClick={() => void onMarkFollowUpSent()}>
                    {t("button.markFollowUpSent")}
                  </Button>
                ) : null}
                {onSimulateReply ? (
                  <Button type="button" size="sm" variant="ghost" disabled={!!pendingAction} onClick={() => void onSimulateReply()}>
                    {t("button.simulateReply")}
                  </Button>
                ) : null}
              </div>
            </SectionCard>
          )}

          <SectionCard title={t("application.timelineTitle")}>
            <ApplicationTimeline timeline={application.timeline} />
          </SectionCard>

          <SectionCard title={t("application.automationLogTitle")}>
            <ApplicationAutomationLogList logs={application.automationLogs} />
          </SectionCard>
        </div>
        </>
      ) : null}
    </ResponsiveDetailPanel>
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
