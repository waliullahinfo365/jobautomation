/**
 * Daily Digest Worker
 * Compiles and emails the daily job application status digest.
 * Schedule: daily at 08:00.
 */

export async function run(): Promise<void> {
  console.log("[daily-digest.worker] Starting run…");

  // TODO: Get all users with emailNotifications = true
  // TODO: For each user, DailyDigestService.sendToUser(userId)
  // TODO: Log to AutomationLog

  console.log("[daily-digest.worker] Run complete.");
}
