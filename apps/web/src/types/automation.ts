export type AutomationStatus = "Active" | "Paused" | "Failed" | "Needs Setup";

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
}

export interface AutomationModule {
  id: string;
  name: string;
  description: string;
  category: AutomationCategory;
  status: AutomationStatus;
  icon: string;
  lastRun?: Date | string;
  nextRun?: Date | string;
  successRate: number;
  totalRuns: number;
  failedRuns: number;
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
