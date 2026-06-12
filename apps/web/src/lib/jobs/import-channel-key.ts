/**
 * Groups dashboard / analytics by a stable import-channel label.
 * Aligns worker/API freeform `source` strings (e.g. "gmail", "email") with UI keys.
 */
export function importChannelGroupKey(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "Manual";
  const lower = s.toLowerCase();
  if (lower === "gmail" || lower === "email") return "Gmail";
  return s;
}
