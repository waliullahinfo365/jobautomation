export type ContactRelationship =
  | "Recruiter"
  | "Hiring Manager"
  | "Referral"
  | "Employee"
  | "Networking"
  | "Other";

export type ContactFollowUpStatus = "Not Needed" | "Scheduled" | "Due Today" | "Overdue" | "Completed";

export type ContactTab = "All Contacts" | "Follow-ups Due" | "Recruiters" | "Referrals" | "Hiring Managers" | "Archived";

export interface ContactRelatedJob {
  id: string;
  company: string;
  position: string;
  status: string;
}

export interface ContactCommunicationEvent {
  id: string;
  title: string;
  detail: string;
  timestamp: Date | string;
  status: "completed" | "pending";
}

export interface ContactAutomationLog {
  id: string;
  module: "Network Follow-Up Automation" | "Email Reply Detection" | "Follow-Up Reminder Engine";
  event: string;
  detail: string;
  timestamp: Date | string;
  status: "success" | "warning" | "error";
}

export interface Contact {
  id: string;
  _id: string;
  name: string;
  firstName: string;
  lastName: string;
  fullName: string;
  company: string;
  role: string;
  title?: string;
  relationship: ContactRelationship;
  type: ContactRelationship;
  email: string;
  phone?: string;
  linkedInUrl?: string;
  linkedinUrl?: string;
  location: string;
  source: string;
  followUpStatus: ContactFollowUpStatus;
  nextFollowUpDate?: Date | string;
  followUpDue?: Date | string;
  followUpReason?: string;
  followUpMessagePreview?: string;
  reminderEnabled: boolean;
  relatedJobs: ContactRelatedJob[];
  jobIds: string[];
  communicationHistory: ContactCommunicationEvent[];
  automationLogs: ContactAutomationLog[];
  notes: string;
  lastContacted: Date | string;
  lastContactedAt?: Date | string;
  archived: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type CreateContactInput = Omit<Contact, "_id" | "id" | "fullName" | "createdAt" | "updatedAt">;
export type UpdateContactInput = Partial<CreateContactInput>;
