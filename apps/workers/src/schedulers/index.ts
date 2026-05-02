export {
  scheduleDailyDigestForAllTenants,
  scheduleDeadlineAlertSweep,
  scheduleFollowUpReminderSweep,
  scheduleLifecycleMonitoringSweep,
  scheduleNetworkFollowUpSweep,
  scheduleWeeklyReportsForAllTenants,
} from "./automation.scheduler";

export function registerSchedulers() {
  // TODO: wire cron/BullMQ repeatable jobs when scheduler infra is enabled.
}
