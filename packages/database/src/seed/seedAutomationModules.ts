import { AutomationModuleModel } from "../models/AutomationModule.model";

type ModuleKey =
  | "job-intake"
  | "duplicate-protection"
  | "folder-automation"
  | "job-apply"
  | "applied-status"
  | "interview-scheduling"
  | "cv-routing"
  | "email-reply-detection"
  | "follow-up-reminder"
  | "pdf-export"
  | "research-document"
  | "ai-processing"
  | "network-follow-up"
  | "offer-tracking"
  | "deadline-alert"
  | "lifecycle-monitoring"
  | "daily-digest"
  | "weekly-report";

const MODULE_DEFS: Array<{
  moduleKey: ModuleKey;
  name: string;
  category: "Jobs" | "Applications" | "Contacts" | "Interviews" | "Documents" | "Reports" | "System";
  description: string;
}> = [
  {
    moduleKey: "job-intake",
    name: "Job intake & parsing",
    category: "Jobs",
    description: "Normalize inbound alerts into structured job records.",
  },
  {
    moduleKey: "duplicate-protection",
    name: "Duplicate protection",
    category: "Jobs",
    description: "Fingerprint and block duplicate listings automatically.",
  },
  {
    moduleKey: "folder-automation",
    name: "Google Drive folders",
    category: "Documents",
    description: "Provision per-job folders in Drive for assets.",
  },
  {
    moduleKey: "job-apply",
    name: "Auto-apply",
    category: "Applications",
    description: "Automate job applications via LinkedIn Easy Apply and other platforms.",
  },
  {
    moduleKey: "applied-status",
    name: "Applied status",
    category: "Applications",
    description: "Track application send and applied automation health.",
  },
  {
    moduleKey: "interview-scheduling",
    name: "Interview scheduling",
    category: "Interviews",
    description: "Create calendar events and prep tasks for interviews.",
  },
  {
    moduleKey: "cv-routing",
    name: "CV routing",
    category: "Documents",
    description: "Route CV artifacts into the correct Drive folders.",
  },
  {
    moduleKey: "email-reply-detection",
    name: "Reply detection",
    category: "Applications",
    description: "Classify recruiter replies and update pipeline stages.",
  },
  {
    moduleKey: "follow-up-reminder",
    name: "Follow-up reminders",
    category: "Applications",
    description: "Schedule nudges when follow-ups are due.",
  },
  {
    moduleKey: "pdf-export",
    name: "PDF export",
    category: "Documents",
    description: "Render research and cover letters to PDF for export.",
  },
  {
    moduleKey: "research-document",
    name: "Research document",
    category: "Documents",
    description: "Generate company/role research briefs with AI.",
  },
  {
    moduleKey: "ai-processing",
    name: "AI processing",
    category: "System",
    description: "End-to-end AI pipeline for parsing and summarization.",
  },
  {
    moduleKey: "network-follow-up",
    name: "Network follow-up",
    category: "Contacts",
    description: "Remind you to follow up on warm networking contacts.",
  },
  {
    moduleKey: "offer-tracking",
    name: "Offer tracking",
    category: "Applications",
    description: "Track offer stage, deadlines, and next actions.",
  },
  {
    moduleKey: "deadline-alert",
    name: "Deadline alerts",
    category: "Jobs",
    description: "Surface roles with upcoming close dates.",
  },
  {
    moduleKey: "lifecycle-monitoring",
    name: "Lifecycle monitoring",
    category: "System",
    description: "Watch long-running application lifecycles for drift.",
  },
  {
    moduleKey: "daily-digest",
    name: "Daily digest",
    category: "Reports",
    description: "Send a daily summary of progress and follow-ups.",
  },
  {
    moduleKey: "weekly-report",
    name: "Weekly report",
    category: "Reports",
    description: "Generate weekly performance and pipeline analytics.",
  },
];

export async function seedAutomationModules(tenantId: string, createdBy = "system") {
  const ops = MODULE_DEFS.map((def) => {
    const { moduleKey, name, category, description } = def;
    return {
      updateOne: {
        filter: { tenantId, moduleKey },
        update: {
          $set: {
            name,
            description,
            category,
            status: "Healthy",
            enabled: true,
          },
          $setOnInsert: {
            tenantId,
            createdBy,
            moduleKey,
            configuration: {},
            totalRuns: 0,
            failedRuns: 0,
          },
        },
        upsert: true,
      },
    };
  });

  if (ops.length) await AutomationModuleModel.bulkWrite(ops);
}
