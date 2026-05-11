import type { ContactFollowUpStatus, ContactRelationship } from "@/types/contact";

const RELATIONSHIP_I18N: Record<ContactRelationship, string> = {
  Recruiter: "contacts.relationship.recruiter",
  "Hiring Manager": "contacts.relationship.hiringManager",
  Referral: "contacts.relationship.referral",
  Employee: "contacts.relationship.employee",
  Networking: "contacts.relationship.networking",
  Other: "contacts.relationship.other",
};

const FOLLOW_UP_I18N: Record<ContactFollowUpStatus, string> = {
  "Not Needed": "contacts.followUpStatus.notNeeded",
  Scheduled: "contacts.followUpStatus.scheduled",
  "Due Today": "contacts.followUpStatus.dueToday",
  Overdue: "contacts.followUpStatus.overdue",
  Completed: "contacts.followUpStatus.completed",
};

const AUTOMATION_MODULE_I18N: Record<string, string> = {
  "Network Follow-Up Automation": "contacts.automationModule.networkFollowUp",
  "Email Reply Detection": "contacts.automationModule.emailReplyDetection",
  "Follow-Up Reminder Engine": "contacts.automationModule.followUpReminder",
};

export function contactRelationshipLabelKey(relationship: ContactRelationship): string {
  return RELATIONSHIP_I18N[relationship];
}

export function contactFollowUpStatusLabelKey(status: ContactFollowUpStatus): string {
  return FOLLOW_UP_I18N[status];
}

export function contactAutomationModuleLabelKey(module: string): string {
  return AUTOMATION_MODULE_I18N[module] ?? module;
}
