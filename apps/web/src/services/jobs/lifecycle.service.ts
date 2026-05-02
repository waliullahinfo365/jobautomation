// TODO: Monitor job/application state transitions and trigger downstream actions.

export class LifecycleService {
  /**
   * TODO: When job moves to "Applied" — update appliedAt, schedule follow-up, auto-label email.
   */
  async onApplied(_jobId: string): Promise<void> {
    throw new Error("LifecycleService.onApplied not implemented");
  }

  /**
   * TODO: When interview is scheduled — create calendar event, set reminder.
   */
  async onInterviewScheduled(_jobId: string, _interviewDate: Date): Promise<void> {
    throw new Error("LifecycleService.onInterviewScheduled not implemented");
  }

  /**
   * TODO: When an offer is received — update status, notify, start offer tracking.
   */
  async onOfferReceived(_jobId: string, _offerDetails: Record<string, unknown>): Promise<void> {
    throw new Error("LifecycleService.onOfferReceived not implemented");
  }

  /**
   * TODO: When job is rejected — archive, update metrics, optionally send network follow-up.
   */
  async onRejected(_jobId: string): Promise<void> {
    throw new Error("LifecycleService.onRejected not implemented");
  }

  /**
   * TODO: Scan all active jobs and flag any that have been stale for too long.
   */
  async flagStaleJobs(): Promise<string[]> {
    // Returns list of jobIds flagged
    throw new Error("LifecycleService.flagStaleJobs not implemented");
  }
}
