export type DemoStepStatus = "Not Started" | "Running" | "Completed" | "Failed";

export interface DemoStepResult {
  preview?: string;
  error?: string;
  raw?: unknown;
}

export interface DemoStep {
  id: string;
  order: number;
  title: string;
  description: string;
  /** Sidebar route or deep link */
  linkHref: string;
  linkLabel: string;
}
