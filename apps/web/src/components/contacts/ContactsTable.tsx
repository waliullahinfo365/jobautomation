import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import type { Contact } from "@/types/contact";
import { ContactRelationshipBadge } from "./ContactRelationshipBadge";
import { ContactFollowUpStatusBadge } from "./ContactFollowUpStatusBadge";
import { formatDate } from "@/lib/utils";

export function ContactsTable({
  contacts,
  onView,
  onMarkFollowedUp,
}: {
  contacts: Contact[];
  onView: (contact: Contact) => void;
  onMarkFollowedUp: (contactId: string) => void;
}) {
  return (
    <SectionCard title="Contacts" description="Recruiters, referrals, hiring managers, and network threads." contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Relationship</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Follow-up Status</TableHead>
            <TableHead>Next Follow-up</TableHead>
            <TableHead>Related Jobs</TableHead>
            <TableHead>Last Contacted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.company}</TableCell>
              <TableCell>{c.role}</TableCell>
              <TableCell><ContactRelationshipBadge relationship={c.relationship} /></TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell><ContactFollowUpStatusBadge status={c.followUpStatus} /></TableCell>
              <TableCell>{c.nextFollowUpDate ? formatDate(c.nextFollowUpDate) : "—"}</TableCell>
              <TableCell>{c.relatedJobs.length}</TableCell>
              <TableCell>{formatDate(c.lastContacted, "MMM d, yyyy")}</TableCell>
              <TableCell className="text-right">
                <div className="inline-flex flex-wrap justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => onView(c)}>View</Button>
                  <Button size="sm" variant="secondary" onClick={() => onMarkFollowedUp(c.id)}>Mark Followed Up</Button>
                  <Button size="sm" variant="ghost">Open LinkedIn</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
