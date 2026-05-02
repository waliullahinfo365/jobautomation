// TODO: Compile and send the weekly performance report.

import type { WeeklyPerformanceReport } from "@/types/report";

export class WeeklyReportService {
  /**
   * TODO: Aggregate this week's metrics from MongoDB.
   */
  async compile(_weekStart?: Date): Promise<WeeklyPerformanceReport> {
    // TODO: Aggregate jobs added, applications submitted, interviews, response rate
    throw new Error("WeeklyReportService.compile not implemented");
  }

  /**
   * TODO: Render the report as HTML.
   */
  async render(_report: WeeklyPerformanceReport): Promise<string> {
    throw new Error("WeeklyReportService.render not implemented");
  }

  /**
   * TODO: Compile + render + send the report email.
   */
  async sendToUser(_userId: string): Promise<void> {
    throw new Error("WeeklyReportService.sendToUser not implemented");
  }
}
