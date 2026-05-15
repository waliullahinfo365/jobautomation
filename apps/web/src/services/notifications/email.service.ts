export interface EmailPayload {
  to:       string | string[];
  subject:  string;
  html:     string;
  text?:    string;
  from?:    string;
}

/**
 * Web-layer email service stub. In production, all transactional email is
 * sent by the Express API workers via Resend (RESEND_API_KEY + RESEND_FROM_EMAIL).
 * Components should call the API via apiFetch rather than this class directly.
 */
export class EmailService {
  async send(_payload: EmailPayload): Promise<void> {
    throw new Error("EmailService.send: use apiFetch to call the API email endpoints.");
  }

  async sendDailyDigest(_to: string, _digestHtml: string): Promise<void> {
    throw new Error("EmailService.sendDailyDigest: use apiFetch to call the API email endpoints.");
  }

  async sendWeeklyReport(_to: string, _reportHtml: string): Promise<void> {
    throw new Error("EmailService.sendWeeklyReport: use apiFetch to call the API email endpoints.");
  }

  async sendFollowUpReminder(_to: string, _jobTitle: string, _company: string): Promise<void> {
    throw new Error("EmailService.sendFollowUpReminder: use apiFetch to call the API email endpoints.");
  }
}
