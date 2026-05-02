import { BuildingIcon, LinkedinIcon, MailIcon, PhoneIcon } from "@/components/icons";
import type { Contact } from "@/types/contact";
import { MotionCard } from "@/components/shared/MotionCard";
import { ContactRelationshipBadge } from "./ContactRelationshipBadge";
import { ContactFollowUpStatusBadge } from "./ContactFollowUpStatusBadge";

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <MotionCard className="hover-lift p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
          {contact.firstName[0]}{contact.lastName[0]}
        </div>
        <div>
          <p className="font-semibold text-sm">{contact.fullName}</p>
          <div className="mt-1 flex gap-2">
            <ContactRelationshipBadge relationship={contact.relationship} />
            <ContactFollowUpStatusBadge status={contact.followUpStatus} />
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        {contact.company && (
          <div className="flex items-center gap-2">
            <BuildingIcon size={14} />
            {contact.company}{contact.title ? ` · ${contact.title}` : ""}
          </div>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-primary">
            <MailIcon size={14} /> {contact.email}
          </a>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2">
            <PhoneIcon size={14} /> {contact.phone}
          </div>
        )}
        {contact.linkedinUrl && (
          <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary">
            <LinkedinIcon size={14} /> LinkedIn
          </a>
        )}
      </div>
    </MotionCard>
  );
}
