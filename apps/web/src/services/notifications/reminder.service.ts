// TODO: Identify jobs/applications that need follow-up and trigger notifications.

import type { Job } from "@/types/job";

export class ReminderService {
  /**
   * TODO: Find all applications where follow-up is due and send reminders.
   */
  async processFollowUpReminders(): Promise<void> {
    // TODO: Query applications where followUpDue <= now and no response received
    // TODO: For each, call EmailService.sendFollowUpReminder
    throw new Error("ReminderService.processFollowUpReminders not implemented");
  }

  /**
   * TODO: Find jobs with approaching deadlines and alert the user.
   */
  async processDeadlineAlerts(): Promise<void> {
    // TODO: Query jobs where deadline is within FOLLOW_UP_DAYS.afterApplied days
    throw new Error("ReminderService.processDeadlineAlerts not implemented");
  }

  /**
   * TODO: Schedule a follow-up reminder for a specific job.
   */
  async scheduleFollowUp(_job: Job, _daysFromNow: number): Promise<void> {
    // TODO: Set followUpDue on the Application document
    throw new Error("ReminderService.scheduleFollowUp not implemented");
  }
}
