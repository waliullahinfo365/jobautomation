"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import type { Contact } from "@/types/contact";
import { ContactRelationshipBadge } from "./ContactRelationshipBadge";
import { ContactFollowUpStatusBadge } from "./ContactFollowUpStatusBadge";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";

export function ContactsTable({
  contacts,
  onView,
  onMarkFollowedUp,
  onOpenLinkedIn,
}: {
  contacts: Contact[];
  onView: (contact: Contact) => void;
  onMarkFollowedUp: (contactId: string) => void;
  onOpenLinkedIn?: (contact: Contact) => void;
}) {
  const { t } = useTranslation();
  return (
    <SectionCard
      title={t("contacts.title")}
      description={t("contacts.tableCardDescription")}
      contentClassName="p-0"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("contacts.table.name")}</TableHead>
            <TableHead>{t("contacts.table.company")}</TableHead>
            <TableHead>{t("contacts.table.role")}</TableHead>
            <TableHead>{t("contacts.table.relationship")}</TableHead>
            <TableHead>{t("contacts.table.email")}</TableHead>
            <TableHead>{t("contacts.table.followUpStatus")}</TableHead>
            <TableHead>{t("contacts.table.nextFollowUp")}</TableHead>
            <TableHead>{t("contacts.table.relatedJobs")}</TableHead>
            <TableHead>{t("contacts.table.lastContacted")}</TableHead>
            <TableHead className="text-right">{t("contacts.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.company}</TableCell>
              <TableCell>{c.role}</TableCell>
              <TableCell>
                <ContactRelationshipBadge relationship={c.relationship} />
              </TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell>
                <ContactFollowUpStatusBadge status={c.followUpStatus} />
              </TableCell>
              <TableCell>{c.nextFollowUpDate ? formatDate(c.nextFollowUpDate) : "—"}</TableCell>
              <TableCell>{c.relatedJobs.length}</TableCell>
              <TableCell>{formatDate(c.lastContacted, "MMM d, yyyy")}</TableCell>
              <TableCell className="text-right">
                <div className="inline-flex flex-wrap justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => onView(c)}>
                    {t("contacts.table.view")}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => onMarkFollowedUp(c.id)}>
                    {t("contacts.table.markFollowedUp")}
                  </Button>
                  {(c.linkedInUrl ?? c.linkedinUrl) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onOpenLinkedIn ? onOpenLinkedIn(c) : window.open(c.linkedInUrl ?? c.linkedinUrl, "_blank", "noopener,noreferrer")}
                    >
                      {t("contacts.table.openLinkedIn")}
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
