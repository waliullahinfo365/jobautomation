/**
 * Weekly Report Worker
 * Compiles and emails the weekly performance report every Monday at 09:00.
 * Schedule: 0 9 * * 1.
 */

export async function run(): Promise<void> {
  console.log("[weekly-report.worker] Starting run…");

  // TODO: Get all users with emailNotifications = true
  // TODO: For each user, WeeklyReportService.sendToUser(userId)
  // TODO: Log to AutomationLog

  console.log("[weekly-report.worker] Run complete.");
}
