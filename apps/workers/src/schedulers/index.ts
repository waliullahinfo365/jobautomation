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
  scheduleAppliedStatusSweep,
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
  scheduleAppliedStatusSweep,
} from "./automation.scheduler";

export function registerSchedulers() {
  if (process.env.SCHEDULER_ENABLED !== "true") return;

  const intakeEveryMs = Number(process.env.GMAIL_INTAKE_INTERVAL_MS ?? 5 * 60_000);
  const reminderEveryMs = Number(process.env.REMINDER_INTERVAL_MS ?? 60 * 60_000);
  const dailyDigestEveryMs = Number(process.env.DAILY_DIGEST_INTERVAL_MS ?? 24 * 60 * 60_000);
  const weeklyEveryMs = Number(process.env.WEEKLY_REPORT_INTERVAL_MS ?? 7 * 24 * 60 * 60_000);
  const keepAliveEveryMs = Number(process.env.LINKEDIN_KEEPALIVE_INTERVAL_MS ?? 4 * 60 * 60_000);
  const autoApplyEveryMs = Number(process.env.AUTO_APPLY_INTERVAL_MS ?? 30 * 60_000);
  const appliedStatusEveryMs = Number(process.env.APPLIED_STATUS_INTERVAL_MS ?? 60 * 60_000);

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
  setInterval(() => void scheduleAppliedStatusSweep(), appliedStatusEveryMs);

  // Run immediately on startup
  void scheduleJobIntakeSweep();
  void scheduleLinkedInSessionKeepAlive();
  void scheduleAutoApplySweep();
  void scheduleAppliedStatusSweep();
  void scheduleDailyDigestForAllTenants();
  void scheduleWeeklyReportsForAllTenants();
}
