import { z } from "zod";
export declare const automationSettingsSchema: z.ZodObject<{
    tenantId: z.ZodString;
    createdBy: z.ZodString;
    moduleKey: z.ZodEnum<["job-intake", "duplicate-protection", "folder-automation", "applied-status", "interview-scheduling", "cv-routing", "email-reply-detection", "follow-up-reminder", "pdf-export", "research-document", "ai-processing", "network-follow-up", "offer-tracking", "deadline-alert", "lifecycle-monitoring", "daily-digest", "weekly-report"]>;
    category: z.ZodEnum<["Jobs", "Applications", "Contacts", "Interviews", "Documents", "Reports", "System"]>;
    enabled: z.ZodBoolean;
    schedule: z.ZodOptional<z.ZodString>;
    configuration: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    createdBy: string;
    moduleKey: "job-intake" | "duplicate-protection" | "folder-automation" | "applied-status" | "interview-scheduling" | "cv-routing" | "email-reply-detection" | "follow-up-reminder" | "pdf-export" | "research-document" | "ai-processing" | "network-follow-up" | "offer-tracking" | "deadline-alert" | "lifecycle-monitoring" | "daily-digest" | "weekly-report";
    category: "Jobs" | "Applications" | "Contacts" | "Interviews" | "Documents" | "Reports" | "System";
    enabled: boolean;
    schedule?: string | undefined;
    configuration?: Record<string, unknown> | undefined;
}, {
    tenantId: string;
    createdBy: string;
    moduleKey: "job-intake" | "duplicate-protection" | "folder-automation" | "applied-status" | "interview-scheduling" | "cv-routing" | "email-reply-detection" | "follow-up-reminder" | "pdf-export" | "research-document" | "ai-processing" | "network-follow-up" | "offer-tracking" | "deadline-alert" | "lifecycle-monitoring" | "daily-digest" | "weekly-report";
    category: "Jobs" | "Applications" | "Contacts" | "Interviews" | "Documents" | "Reports" | "System";
    enabled: boolean;
    schedule?: string | undefined;
    configuration?: Record<string, unknown> | undefined;
}>;
export declare const automationSettingsUpdateSchema: z.ZodObject<{
    tenantId: z.ZodOptional<z.ZodString>;
    createdBy: z.ZodOptional<z.ZodString>;
    moduleKey: z.ZodOptional<z.ZodEnum<["job-intake", "duplicate-protection", "folder-automation", "applied-status", "interview-scheduling", "cv-routing", "email-reply-detection", "follow-up-reminder", "pdf-export", "research-document", "ai-processing", "network-follow-up", "offer-tracking", "deadline-alert", "lifecycle-monitoring", "daily-digest", "weekly-report"]>>;
    category: z.ZodOptional<z.ZodEnum<["Jobs", "Applications", "Contacts", "Interviews", "Documents", "Reports", "System"]>>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    schedule: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    configuration: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strip", z.ZodTypeAny, {
    tenantId?: string | undefined;
    createdBy?: string | undefined;
    moduleKey?: "job-intake" | "duplicate-protection" | "folder-automation" | "applied-status" | "interview-scheduling" | "cv-routing" | "email-reply-detection" | "follow-up-reminder" | "pdf-export" | "research-document" | "ai-processing" | "network-follow-up" | "offer-tracking" | "deadline-alert" | "lifecycle-monitoring" | "daily-digest" | "weekly-report" | undefined;
    category?: "Jobs" | "Applications" | "Contacts" | "Interviews" | "Documents" | "Reports" | "System" | undefined;
    enabled?: boolean | undefined;
    schedule?: string | undefined;
    configuration?: Record<string, unknown> | undefined;
}, {
    tenantId?: string | undefined;
    createdBy?: string | undefined;
    moduleKey?: "job-intake" | "duplicate-protection" | "folder-automation" | "applied-status" | "interview-scheduling" | "cv-routing" | "email-reply-detection" | "follow-up-reminder" | "pdf-export" | "research-document" | "ai-processing" | "network-follow-up" | "offer-tracking" | "deadline-alert" | "lifecycle-monitoring" | "daily-digest" | "weekly-report" | undefined;
    category?: "Jobs" | "Applications" | "Contacts" | "Interviews" | "Documents" | "Reports" | "System" | undefined;
    enabled?: boolean | undefined;
    schedule?: string | undefined;
    configuration?: Record<string, unknown> | undefined;
}>;
