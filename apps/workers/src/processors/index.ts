export function registerProcessors() {
  // TODO: register BullMQ/Redis processors.
  // Keeping imports explicit makes these processors testable in isolation.
  void import("./job-intake.processor");
  void import("./duplicate-protection.processor");
  void import("./ai-processing.processor");
  void import("./research-document.processor");
  void import("./applied-status.processor");
  void import("./follow-up-reminder.processor");
  void import("./email-reply-detection.processor");
  void import("./folder-automation.processor");
  void import("./cv-routing.processor");
  void import("./pdf-export.processor");
  void import("./interview-scheduling.processor");
  void import("./daily-digest.processor");
  void import("./weekly-report.processor");
}
