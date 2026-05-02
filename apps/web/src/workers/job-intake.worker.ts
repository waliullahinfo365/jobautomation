/**
 * Job Intake Worker
 * Polls for pending raw job entries and runs them through the intake pipeline.
 * Schedule: on-demand / triggered via API route.
 */

export async function run(): Promise<void> {
  console.log("[job-intake.worker] Starting run…");

  // TODO: Query for jobs with status "New" and no driveFolderId
  // TODO: For each, call JobIntakeService.ingest
  // TODO: Log result to AutomationLog

  console.log("[job-intake.worker] Run complete.");
}
