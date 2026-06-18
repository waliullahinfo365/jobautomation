"use client";

import { CloseIcon } from "@/components/icons";
import type { Contact } from "@/types/contact";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { ContactRelationshipBadge } from "./ContactRelationshipBadge";
import { ContactFollowUpStatusBadge } from "./ContactFollowUpStatusBadge";
import { ContactRelatedJobs } from "./ContactRelatedJobs";
import { ContactCommunicationTimeline } from "./ContactCommunicationTimeline";
import { ContactAutomationActivity } from "./ContactAutomationActivity";
import { formatDate } from "@/lib/utils";
import { ResponsiveDetailPanel } from "@/components/shared/ResponsiveDetailPanel";
import { useTranslation } from "@/i18n/useTranslation";
import { contactAutomationModuleLabelKey } from "./contact-labels";

export function ContactDetailPanel({
  contact,
  open,
  onClose,
}: {
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <ResponsiveDetailPanel open={open && !!contact} onClose={onClose}>
      {contact ? (
        <>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{contact.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {contact.company} · {contact.role}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <ContactRelationshipBadge relationship={contact.relationship} />
                  <ContactFollowUpStatusBadge status={contact.followUpStatus} />
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <CloseIcon size={20} />
              </Button>
            </div>

            <div className="space-y-5">
              <SectionCard title={t("contacts.detail.contactInformation")}>
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <Info label={t("contacts.detail.email")} value={contact.email} />
                  <Info label={t("contacts.detail.phone")} value={contact.phone || "—"} />
                  <Info label={t("contacts.detail.linkedInUrl")} value={contact.linkedInUrl || "—"} />
                  <Info label={t("contacts.detail.location")} value={contact.location} />
                  <Info label={t("contacts.detail.source")} value={contact.source} />
                  <Info
                    label={t("contacts.detail.lastContacted")}
                    value={formatDate(contact.lastContacted, "MMM d, yyyy HH:mm")}
                  />
                  <Info
                    label={t("contacts.detail.nextFollowUp")}
                    value={
                      contact.nextFollowUpDate
                        ? formatDate(contact.nextFollowUpDate, "MMM d, yyyy HH:mm")
                        : "—"
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard title={t("contacts.detail.relatedJobs")}>
                <ContactRelatedJobs jobs={contact.relatedJobs} />
              </SectionCard>

              <SectionCard title={t("contacts.detail.communicationHistory")}>
                <ContactCommunicationTimeline events={contact.communicationHistory} />
              </SectionCard>

              <SectionCard title={t("contacts.detail.followUpPlan")}>
                <div className="space-y-2 text-sm">
                  <Info
                    label={t("contacts.detail.nextFollowUpDate")}
                    value={
                      contact.nextFollowUpDate
                        ? formatDate(contact.nextFollowUpDate, "MMM d, yyyy HH:mm")
                        : "—"
                    }
                  />
                  <Info label={t("contacts.detail.followUpReason")} value={contact.followUpReason || "—"} />
                  <Info
                    label={t("contacts.detail.followUpMessagePreview")}
                    value={contact.followUpMessagePreview || "—"}
                  />
                  <Info
                    label={t("contacts.detail.reminderEnabled")}
                    value={contact.reminderEnabled ? t("contacts.detail.yes") : t("contacts.detail.no")}
                  />
                  <Info
                    label={t("contacts.detail.automationModule")}
                    value={t(contactAutomationModuleLabelKey("Network Follow-Up Automation"))}
                  />
                </div>
              </SectionCard>

              <SectionCard title={t("contacts.detail.notes")}>
                <p className="text-sm text-muted-foreground">{contact.notes}</p>
              </SectionCard>

              <SectionCard title={t("contacts.detail.automationActivity")}>
                <ContactAutomationActivity logs={contact.automationLogs} />
              </SectionCard>
            </div>
        </>
      ) : null}
    </ResponsiveDetailPanel>
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
