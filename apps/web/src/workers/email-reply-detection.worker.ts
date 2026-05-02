/**
 * Email Reply Detection Worker
 * Checks Gmail for replies related to tracked job applications.
 * Schedule: every 15 minutes.
 */

export async function run(): Promise<void> {
  console.log("[email-reply-detection.worker] Starting run…");

  // TODO: Load Google OAuth tokens from user integrations
  // TODO: GmailService.searchMessages("label:job-applications is:unread")
  // TODO: For each message, match to an Application by thread ID or company domain
  // TODO: Update application.responseReceivedAt
  // TODO: Update job status if appropriate
  // TODO: Log to AutomationLog

  console.log("[email-reply-detection.worker] Run complete.");
}
