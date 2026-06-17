import type { contactRelationships, followUpStatuses } from "../constants/statuses";
export type ContactRelationship = (typeof contactRelationships)[number];
export type ContactFollowUpStatus = (typeof followUpStatuses)[number];
export interface Contact {
    id: string;
    tenantId: string;
    createdBy: string;
    name: string;
    company?: string;
    role?: string;
    relationship: ContactRelationship;
    email?: string;
    phone?: string;
    linkedInUrl?: string;
    location?: string;
    source?: string;
    followUpStatus: ContactFollowUpStatus;
    nextFollowUpDate?: string;
    followUpReason?: string;
    followUpMessagePreview?: string;
    reminderEnabled?: boolean;
    relatedJobIds?: string[];
    notes?: string;
    lastContacted?: string;
    archived?: boolean;
    createdAt: string;
    updatedAt: string;
}
