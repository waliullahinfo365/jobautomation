// TODO: Compile and send the daily digest report.

import type { DailyDigestReport } from "@/types/report";

export class DailyDigestService {
  /**
   * TODO: Aggregate today's stats from MongoDB.
   */
  async compile(_date?: Date): Promise<DailyDigestReport> {
    // TODO: Count new jobs, applications, interviews, overdue deadlines, automation errors
    throw new Error("DailyDigestService.compile not implemented");
  }

  /**
   * TODO: Render the digest as an HTML email template.
   */
  async render(_report: DailyDigestReport): Promise<string> {
    // TODO: Use a React email template or handlebars
    throw new Error("DailyDigestService.render not implemented");
  }

  /**
   * TODO: Compile + render + send the digest email.
   */
  async sendToUser(_userId: string): Promise<void> {
    throw new Error("DailyDigestService.sendToUser not implemented");
  }
}
