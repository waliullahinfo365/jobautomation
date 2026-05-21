export {
  scheduleDailyDigestForAllTenants,
  scheduleDeadlineAlertSweep,
  scheduleFollowUpReminderSweep,
  scheduleJobIntakeSweep,
  scheduleLifecycleMonitoringSweep,
  scheduleNetworkFollowUpSweep,
  scheduleOfferTrackingSweep,
  scheduleWeeklyReportsForAllTenants,
  scheduleLinkedInSessionKeepAlive,
  scheduleAutoApplySweep,
} from "./automation.scheduler";

import {
  scheduleDailyDigestForAllTenants,
  scheduleDeadlineAlertSweep,
  scheduleFollowUpReminderSweep,
  scheduleJobIntakeSweep,
  scheduleLifecycleMonitoringSweep,
  scheduleNetworkFollowUpSweep,
  scheduleOfferTrackingSweep,
  scheduleWeeklyReportsForAllTenants,
  scheduleLinkedInSessionKeepAlive,
  scheduleAutoApplySweep,
} from "./automation.scheduler";

export function registerSchedulers() {
  if (process.env.SCHEDULER_ENABLED !== "true") return;

  const intakeEveryMs = Number(process.env.GMAIL_INTAKE_INTERVAL_MS ?? 5 * 60_000);
  const reminderEveryMs = Number(process.env.REMINDER_INTERVAL_MS ?? 60 * 60_000);
  const dailyDigestEveryMs = Number(process.env.DAILY_DIGEST_INTERVAL_MS ?? 24 * 60 * 60_000);
  const weeklyEveryMs = Number(process.env.WEEKLY_REPORT_INTERVAL_MS ?? 7 * 24 * 60 * 60_000);
  // Keep-alive every 4h (reduced from 12h) — LinkedIn sessions expire faster than expected
  const keepAliveEveryMs = Number(process.env.LINKEDIN_KEEPALIVE_INTERVAL_MS ?? 4 * 60 * 60_000);
  // Auto-apply sweep every 30 minutes — picks up "Ready to Apply" jobs automatically
  const autoApplyEveryMs = Number(process.env.AUTO_APPLY_INTERVAL_MS ?? 30 * 60_000);

  setInterval(() => void scheduleFollowUpReminderSweep(), reminderEveryMs);
  setInterval(() => void scheduleDeadlineAlertSweep(), reminderEveryMs);
  setInterval(() => void scheduleLifecycleMonitoringSweep(), reminderEveryMs);
  setInterval(() => void scheduleNetworkFollowUpSweep(), reminderEveryMs);
  setInterval(() => void scheduleOfferTrackingSweep(), reminderEveryMs);
  setInterval(() => void scheduleDailyDigestForAllTenants(), dailyDigestEveryMs);
  setInterval(() => void scheduleWeeklyReportsForAllTenants(), weeklyEveryMs);
  setInterval(() => void scheduleJobIntakeSweep(), intakeEveryMs);
  setInterval(() => void scheduleLinkedInSessionKeepAlive(), keepAliveEveryMs);
  setInterval(() => void scheduleAutoApplySweep(), autoApplyEveryMs);

  void scheduleJobIntakeSweep();
  void scheduleLinkedInSessionKeepAlive();
  void scheduleAutoApplySweep();
}
