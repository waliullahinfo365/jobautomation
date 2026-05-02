/**
 * Deadline Alert Worker
 * Notifies the user when a job application deadline is approaching.
 * Schedule: daily at 07:00.
 */

export async function run(): Promise<void> {
  console.log("[deadline-alert.worker] Starting run…");

  // TODO: Query jobs where deadline <= now + FOLLOW_UP_DAYS.afterApplied
  // TODO: Filter out already-alerted jobs
  // TODO: EmailService.send for each upcoming deadline
  // TODO: Log to AutomationLog

  console.log("[deadline-alert.worker] Run complete.");
}
