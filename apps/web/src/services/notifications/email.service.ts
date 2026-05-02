// TODO: Implement with Nodemailer using SMTP, or route through Gmail API.

export interface EmailPayload {
  to:       string | string[];
  subject:  string;
  html:     string;
  text?:    string;
  from?:    string;
}

export class EmailService {
  /**
   * TODO: Send a transactional email.
   */
  async send(_payload: EmailPayload): Promise<void> {
    // TODO: Create Nodemailer transporter from env.smtp config
    // TODO: transporter.sendMail(payload)
    throw new Error("EmailService.send not implemented");
  }

  /**
   * TODO: Send the daily digest email to the user.
   */
  async sendDailyDigest(_to: string, _digestHtml: string): Promise<void> {
    throw new Error("EmailService.sendDailyDigest not implemented");
  }

  /**
   * TODO: Send the weekly performance report email.
   */
  async sendWeeklyReport(_to: string, _reportHtml: string): Promise<void> {
    throw new Error("EmailService.sendWeeklyReport not implemented");
  }

  /**
   * TODO: Send a follow-up reminder notification.
   */
  async sendFollowUpReminder(_to: string, _jobTitle: string, _company: string): Promise<void> {
    throw new Error("EmailService.sendFollowUpReminder not implemented");
  }
}
