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
import { AnimatePresence, motion } from "framer-motion";

export function ContactDetailPanel({
  contact,
  open,
  onClose,
}: {
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && contact ? (
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
            className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-card/95 p-6 backdrop-blur-xl"
          >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{contact.name}</h2>
            <p className="text-sm text-muted-foreground">{contact.company} · {contact.role}</p>
            <div className="mt-2 flex gap-2">
              <ContactRelationshipBadge relationship={contact.relationship} />
              <ContactFollowUpStatusBadge status={contact.followUpStatus} />
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <CloseIcon size={20} />
          </Button>
        </div>

        <div className="space-y-5">
          <SectionCard title="Contact Information">
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <Info label="Email" value={contact.email} />
              <Info label="Phone" value={contact.phone || "—"} />
              <Info label="LinkedIn URL" value={contact.linkedInUrl || "—"} />
              <Info label="Location" value={contact.location} />
              <Info label="Source" value={contact.source} />
              <Info label="Last Contacted" value={formatDate(contact.lastContacted, "MMM d, yyyy HH:mm")} />
              <Info label="Next Follow-up" value={contact.nextFollowUpDate ? formatDate(contact.nextFollowUpDate, "MMM d, yyyy HH:mm") : "—"} />
            </div>
          </SectionCard>

          <SectionCard title="Related Jobs">
            <ContactRelatedJobs jobs={contact.relatedJobs} />
          </SectionCard>

          <SectionCard title="Communication History">
            <ContactCommunicationTimeline events={contact.communicationHistory} />
          </SectionCard>

          <SectionCard title="Follow-Up Plan">
            <div className="space-y-2 text-sm">
              <Info label="Next follow-up date" value={contact.nextFollowUpDate ? formatDate(contact.nextFollowUpDate, "MMM d, yyyy HH:mm") : "—"} />
              <Info label="Follow-up reason" value={contact.followUpReason || "—"} />
              <Info label="Follow-up message preview" value={contact.followUpMessagePreview || "—"} />
              <Info label="Reminder enabled" value={contact.reminderEnabled ? "Yes" : "No"} />
              <Info label="Automation module" value="Network Follow-Up Automation" />
            </div>
          </SectionCard>

          <SectionCard title="Notes">
            <p className="text-sm text-muted-foreground">{contact.notes}</p>
          </SectionCard>

          <SectionCard title="Automation Activity">
            <ContactAutomationActivity logs={contact.automationLogs} />
          </SectionCard>
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
