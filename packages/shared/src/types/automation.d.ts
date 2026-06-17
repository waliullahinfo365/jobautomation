import type { automationCategories, automationModuleKeys } from "../constants/statuses";
export type AutomationModuleKey = (typeof automationModuleKeys)[number];
export type AutomationCategory = (typeof automationCategories)[number];
export interface AutomationModule {
    id: string;
    tenantId: string;
    createdBy: string;
    moduleKey: AutomationModuleKey;
    name: string;
    description?: string;
    category: AutomationCategory;
    status: "Healthy" | "Warning" | "Error" | "Paused";
    enabled: boolean;
    schedule?: string;
    triggerType?: string;
    triggerSource?: string;
    configuration?: Record<string, unknown>;
    successRate?: number;
    totalRuns?: number;
    failedRuns?: number;
    lastRunAt?: string;
    nextRunAt?: string;
    averageDurationMs?: number;
    createdAt: string;
    updatedAt: string;
}
export interface AutomationLog {
    id: string;
    tenantId: string;
    createdBy: string;
    moduleKey: AutomationModuleKey;
    moduleName: string;
    status: "Success" | "Warning" | "Failed" | "Running";
    message: string;
    relatedRecordType?: string;
    relatedRecordId?: string;
    durationMs?: number;
    metadata?: Record<string, unknown>;
    error?: string;
    createdAt: string;
    updatedAt: string;
}
