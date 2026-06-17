/**
 * Groups dashboard / analytics by a stable import-channel label.
 * Aligns worker/API freeform `source` strings (e.g. "gmail", "email") with UI keys.
 */
export function importChannelGroupKey(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "Manual";
  const lower = s.toLowerCase();
  if (lower.includes("linkedin")) return "LinkedIn";
  if (lower === "gmail" || lower === "email") return "Gmail";
  if (lower.includes("indeed")) return "Indeed";
  if (lower.includes("stepstone")) return "StepStone";
  if (lower.includes("xing")) return "Xing";
  if (lower === "manual" || lower === "user") return "Manual";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
