import { AutomationModuleModel } from "../models/AutomationModule.model";
const moduleKeys = [
    "job-intake",
    "duplicate-protection",
    "folder-automation",
    "applied-status",
    "interview-scheduling",
    "cv-routing",
    "email-reply-detection",
    "follow-up-reminder",
    "pdf-export",
    "research-document",
    "ai-processing",
    "network-follow-up",
    "offer-tracking",
    "deadline-alert",
    "lifecycle-monitoring",
    "daily-digest",
    "weekly-report",
];
export async function seedAutomationModules(tenantId, createdBy = "system") {
    const ops = moduleKeys.map((moduleKey) => ({
        updateOne: {
            filter: { tenantId, moduleKey },
            update: {
                $setOnInsert: {
                    tenantId,
                    createdBy,
                    moduleKey,
                    name: moduleKey,
                    category: "System",
                    status: "Healthy",
                    enabled: true,
                    configuration: {},
                },
            },
            upsert: true,
        },
    }));
    if (ops.length)
        await AutomationModuleModel.bulkWrite(ops);
}
