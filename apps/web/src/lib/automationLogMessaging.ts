/**
 * User-facing copy for automation log rows (technical messages stay in `technicalMessage`).
 */
export function friendlyAutomationLogMessage(technical: string): string {
  const t = technical.trim();
  if (!t) return "Automation event recorded";
  if (/automation job queued via api queue facade/i.test(t)) return "Automation queued for processing";
  if (/queued via api queue/i.test(t)) return "Automation queued for processing";
  if (/queue facade/i.test(t) && /queued/i.test(t)) return "Automation queued for processing";
  if (/automation run queued/i.test(t)) return "Automation queued for processing";
  return t;
}
