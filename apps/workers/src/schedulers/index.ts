export {
  scheduleDailyDigestForAllTenants,
  scheduleDeadlineAlertSweep,
  scheduleFollowUpReminderSweep,
  scheduleJobIntakeSweep,
  scheduleLifecycleMonitoringSweep,
  scheduleNetworkFollowUpSweep,
  scheduleWeeklyReportsForAllTenants,
} from "./automation.scheduler";

import {
  scheduleDailyDigestForAllTenants,
  scheduleDeadlineAlertSweep,
  scheduleFollowUpReminderSweep,
  scheduleJobIntakeSweep,
  scheduleLifecycleMonitoringSweep,
  scheduleNetworkFollowUpSweep,
  scheduleWeeklyReportsForAllTenants,
} from "./automation.scheduler";

export function registerSchedulers() {
  if (process.env.SCHEDULER_ENABLED !== "true") return;

  const intakeEveryMs = Number(process.env.GMAIL_INTAKE_INTERVAL_MS ?? 5 * 60_000);
  const reminderEveryMs = Number(process.env.REMINDER_INTERVAL_MS ?? 60 * 60_000);
  const dailyDigestEveryMs = Number(process.env.DAILY_DIGEST_INTERVAL_MS ?? 24 * 60 * 60_000);
  const weeklyEveryMs = Number(process.env.WEEKLY_REPORT_INTERVAL_MS ?? 7 * 24 * 60 * 60_000);

  setInterval(() => void scheduleFollowUpReminderSweep(), reminderEveryMs);
  setInterval(() => void scheduleDeadlineAlertSweep(), reminderEveryMs);
  setInterval(() => void scheduleLifecycleMonitoringSweep(), reminderEveryMs);
  setInterval(() => void scheduleNetworkFollowUpSweep(), reminderEveryMs);
  setInterval(() => void scheduleDailyDigestForAllTenants(), dailyDigestEveryMs);
  setInterval(() => void scheduleWeeklyReportsForAllTenants(), weeklyEveryMs);
  setInterval(() => void scheduleJobIntakeSweep(), intakeEveryMs);
}
