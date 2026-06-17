import { JobModel } from "@jobflow/database/models";
import { jobPipelineStages } from "@jobflow/shared/constants/pipeline";
import { getAutomationModuleHealth } from "./automation-health.service";
import { importChannelGroupKey } from "../utils/import-channel-key";
import {
  baseTrackedJobsFilter,
  countFollowUpsDue,
  countJobsToReviewToday,
  countUpcomingInterviews,
  getPipelineCounts,
  hasActiveCoverLetterTemplateMetadata,
  hasActiveCvMetadata,
  pipelineCountsToSummary,
} from "./job-pipeline.service";

function greetingForHour(hour: number): "Good Morning" | "Good Afternoon" | "Good Evening" {
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function greetingForTimezone(timezone?: string): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone || "UTC" });
    const hour = Number(fmt.format(new Date()));
    return greetingForHour(Number.isFinite(hour) ? hour : 12);
  } catch {
    return greetingForHour(new Date().getHours());
  }
}

export async function getTodaySummary(input: { tenantId: string; userId: string; timezone?: string }) {
  const { tenantId, userId } = input;
  const [
    jobsToReviewToday,
    pipelineCounts,
    followUpsDue,
    interviewsSoon,
    missingCv,
    missingCoverLetterTemplate,
    sourceRows,
    automationModules,
  ] = await Promise.all([
    countJobsToReviewToday(tenantId),
    getPipelineCounts(tenantId),
    countFollowUpsDue(tenantId),
    countUpcomingInterviews(tenantId),
    hasActiveCvMetadata(tenantId, userId).then((ok) => !ok),
    hasActiveCoverLetterTemplateMetadata(tenantId, userId).then((ok) => !ok),
    JobModel.find(baseTrackedJobsFilter(tenantId)).select("source").lean(),
    getAutomationModuleHealth(tenantId),
  ]);

  const channelMap = new Map<string, number>();
  for (const row of sourceRows as Array<{ source?: string }>) {
    const key = importChannelGroupKey(row.source);
    channelMap.set(key, (channelMap.get(key) ?? 0) + 1);
  }
  const jobsBySource = [...channelMap.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  const { pipeline, totalActive } = pipelineCountsToSummary(pipelineCounts);
  const pipelineRecord = Object.fromEntries(
    jobPipelineStages.map((s) => [s.toLowerCase(), pipelineCounts[s] ?? 0])
  ) as Record<string, number>;

  const actions: Array<{
    type: string;
    title: string;
    description: string;
    cta: string;
    href: string;
  }> = [];

  if (jobsToReviewToday > 0) {
    actions.push({
      type: "review_jobs",
      title: `${jobsToReviewToday} new job${jobsToReviewToday === 1 ? "" : "s"} to review`,
      description: "New job opportunities are waiting for your decision.",
      cta: "Review Jobs",
      href: "/jobs/review",
    });
  }
  if (missingCv) {
    actions.push({
      type: "missing_cv",
      title: "Your CV is missing",
      description: "Connect Google Drive and set your default CV so Job Assistant can prepare applications.",
      cta: "Upload CV",
      href: "/documents/upload?type=cv",
    });
  }
  if (missingCoverLetterTemplate) {
    actions.push({
      type: "missing_cover_letter_template",
      title: "Cover letter template missing",
      description: "Add a cover letter template in Drive to speed up manual applications.",
      cta: "Upload Template",
      href: "/documents/upload?type=cover_letter_template",
    });
  }
  if (followUpsDue > 0) {
    actions.push({
      type: "follow_up",
      title: `${followUpsDue} application${followUpsDue === 1 ? "" : "s"} need follow-up`,
      description: "It's been a while since you applied.",
      cta: "Review Follow-ups",
      href: "/applications?filter=follow-up-due",
    });
  }
  if ((pipelineCounts.Ready ?? 0) > 0) {
    actions.push({
      type: "ready_to_apply",
      title: `${pipelineCounts.Ready} job${pipelineCounts.Ready === 1 ? "" : "s"} ready to apply`,
      description: "Documents are ready — open the Apply Assistant when you're on the employer site.",
      cta: "Apply Now",
      href: "/jobs?status=Ready",
    });
  }
  if (interviewsSoon > 0) {
    actions.push({
      type: "interviews",
      title: `${interviewsSoon} interview${interviewsSoon === 1 ? "" : "s"} coming up`,
      description: "Prepare for upcoming conversations.",
      cta: "View Interviews",
      href: "/interviews",
    });
  }

  const modules = Array.isArray(automationModules) ? automationModules : [];
  const userFacingKeys = new Set([
    "job-intake",
    "ai-processing",
    "research-document",
    "follow-up-reminder",
    "email-reply-detection",
    "deadline-alert",
    "daily-digest",
  ]);
  const exposed = modules.filter((m: { moduleKey?: string }) =>
    userFacingKeys.has(String(m.moduleKey ?? ""))
  );
  const enabledAutomations = exposed.filter(
    (m: { status?: string }) => m.status === "healthy" || m.status === "ready" || m.status === "warning"
  ).length;
  const needsSetup = exposed.some(
    (m: { status?: string }) => m.status === "needs_setup" || m.status === "failed"
  );

  return {
    greeting: greetingForTimezone(input.timezone),
    jobsToReviewToday,
    actions,
    missingDocuments: {
      cv: missingCv,
      coverLetterTemplate: missingCoverLetterTemplate,
    },
    jobsBySource,
    pipeline: pipelineRecord,
    pipelineStages: pipeline,
    totalTracked: totalActive,
    systemStatus: {
      label: "Job Assistant active",
      enabledAutomations: enabledAutomations || exposed.length,
      totalExposed: exposed.length,
      status: needsSetup ? "needs_setup" : "ready",
    },
  };
}
