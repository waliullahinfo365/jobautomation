import { apiFetch } from "./client";

export type TodayAction = {
  type: string;
  title: string;
  description: string;
  cta: string;
  href: string;
};

export type TodaySummary = {
  greeting: string;
  jobsToReviewToday: number;
  actions: TodayAction[];
  missingDocuments: { cv: boolean; coverLetterTemplate: boolean };
  jobsBySource: { source: string; count: number }[];
  pipeline: Record<string, number>;
  pipelineStages: { status: string; count: number }[];
  totalTracked: number;
  systemStatus: {
    label: string;
    enabledAutomations: number;
    totalExposed?: number;
    status: "ready" | "needs_setup";
  };
};

export function getTodaySummary() {
  return apiFetch<TodaySummary>("/today/summary");
}
