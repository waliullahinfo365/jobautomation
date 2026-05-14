export type AutomationStatus =
  | "Active"
  | "Paused"
  | "Failed"
  | "Needs Setup"
  | "Ready"
  | "Not run yet"
  | "Healthy"
  | "Warning";

export type AutomationCategory =
  | "Intake"
  | "Pipeline"
  | "Documents"
  | "Communication"
  | "AI Processing"
  | "Reporting"
  | "Monitoring";

export type AutomationLogStatus = "Success" | "Warning" | "Failed";

export interface AutomationAction {
  id: string;
  title: string;
  detail: string;
}

export interface AutomationConfiguration {
  connectedAccount: "Not connected" | "Gmail connected" | "Google Drive connected" | "Google Calendar connected";
  environment: "Development";
  retryPolicy: string;
  errorHandling: "Enabled" | "Disabled";
}

export interface AutomationLog {
  id: string;
  _id: string; // compatibility alias
  moduleId: string;
  moduleName: string;
  status: AutomationLogStatus;
  message: string;
  relatedRecord: string;
  duration: string;
  createdAt: Date | string;
  operationId?: string;
  jobId?: string;
  metadata?: Record<string, unknown>;
  /** Original API message before friendly display mapping */
  technicalMessage?: string;
  /** Backend `error` string when automation failed */
  error?: string;
}

export interface AutomationModule {
  id: string;
  key?: string;
  moduleKey?: string;
  name: string;
  description: string;
  category: AutomationCategory;
  status: AutomationStatus;
  icon: string;
  lastRun?: Date | string;
  nextRun?: Date | string;
  successRate: number;
  totalRuns: number;
  successRuns?: number;
  failedRuns: number;
  warningRuns?: number;
  avgDurationMs?: number | null;
  lastRunStatus?: string | null;
  lastMessage?: string | null;
  lastError?: string | null;
  requiredIntegrations?: string[];
  missingRequirements?: string[];
  recommendedNextStep?: string;
  readiness?: Record<string, boolean>;
  averageDuration: string;
  triggerType: string;
  triggerSource: string;
  schedule: string;
  inputSource: string;
  actions: AutomationAction[];
  configuration: AutomationConfiguration;
  recentLogs: AutomationLog[];

  // compatibility aliases for existing components
  lastRunAt?: Date | string;
  nextRunAt?: Date | string;
  runCount?: number;
  errorCount?: number;
  config?: Record<string, unknown>;
}
