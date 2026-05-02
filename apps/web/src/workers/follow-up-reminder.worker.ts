/**
 * Follow-Up Reminder Worker
 * Sends reminders for applications that haven't received a response.
 * Schedule: daily at 09:00.
 */

export async function run(): Promise<void> {
  console.log("[follow-up-reminder.worker] Starting run…");

  // TODO: ReminderService.processFollowUpReminders()
  // TODO: Log results to AutomationLog

  console.log("[follow-up-reminder.worker] Run complete.");
}
