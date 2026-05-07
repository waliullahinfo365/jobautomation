import type { DailyDigestMetrics, WeeklyPerformanceMetrics } from "@jobflow/shared/types/report";

export function buildDailyDigestMarkdown(metrics: DailyDigestMetrics, recommendations: string[]): string {
  return [
    `# Daily Digest — ${metrics.date}`,
    "",
    "## Activity",
    `- **New jobs:** ${metrics.newJobs}`,
    `- **Applications sent:** ${metrics.applicationsSent}`,
    `- **Follow-ups due:** ${metrics.followUpsDue}`,
    `- **Replies received:** ${metrics.repliesReceived}`,
    `- **Interviews scheduled:** ${metrics.interviewsScheduled}`,
    `- **Offers received:** ${metrics.offersReceived}`,
    `- **Deadlines approaching:** ${metrics.deadlinesApproaching}`,
    `- **Failed automations:** ${metrics.failedAutomations}`,
    "",
    "## Recommended actions",
    ...(recommendations.length ? recommendations.map((r) => `- ${r}`) : ["- No critical actions detected."]),
    "",
  ].join("\n");
}

export function buildWeeklyPerformanceMarkdown(metrics: WeeklyPerformanceMetrics): string {
  const rrPct = metrics.responseRate <= 1 ? Math.round(metrics.responseRate * 100) : Math.round(metrics.responseRate);
  const icPct =
    metrics.interviewConversionRate <= 1
      ? Math.round(metrics.interviewConversionRate * 100)
      : Math.round(metrics.interviewConversionRate);
  const offerPct = metrics.offerRate <= 1 ? Math.round(metrics.offerRate * 100) : Math.round(metrics.offerRate);

  return [
    `# Weekly Performance — ${metrics.weekStart} to ${metrics.weekEnd}`,
    "",
    "## KPIs",
    `- **Jobs found:** ${metrics.totalJobsFound}`,
    `- **Applications submitted:** ${metrics.applicationsSubmitted}`,
    `- **Replies:** ${metrics.repliesReceived} (~${rrPct}% reply rate)`,
    `- **Interviews:** ${metrics.interviewsScheduled} (~${icPct}% vs applications)`,
    `- **Offers:** ${metrics.offersReceived} (~${offerPct}% vs applications)`,
    `- **Rejections:** ${metrics.rejections}`,
    "",
    "## Top sources",
    ...metrics.topSources.map((t) => `- ${t.source}: ${t.count}`),
    "",
    "## Recommendations",
    ...(metrics.recommendations?.length ? metrics.recommendations.map((r) => `- ${r}`) : ["- Metrics look balanced for this period."]),
    "",
  ].join("\n");
}
