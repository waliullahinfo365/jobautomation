/** Canonical pipeline stage for Today / Jobs UI (mirrors @jobflow/shared/constants/pipeline). */
export type PipelineStage =
  | "New"
  | "Saved"
  | "Drafting"
  | "Ready"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Closed";

export function legacyJobStatusToPipelineStage(status: string): PipelineStage {
  switch (status) {
    case "New":
      return "New";
    case "Saved":
      return "Saved";
    case "Research":
    case "Drafting":
      return "Drafting";
    case "Ready to Apply":
    case "Applying":
    case "External Apply Required":
      return "Ready";
    case "Applied":
      return "Applied";
    case "Interview":
      return "Interview";
    case "Offer":
      return "Offer";
    case "Rejected":
    case "Archived":
      return "Closed";
    default:
      return "New";
  }
}

export function resolvePipelineStage(raw: { status?: unknown; pipelineStage?: unknown }): PipelineStage {
  const stage = String(raw.pipelineStage ?? "").trim();
  if (stage) return legacyJobStatusToPipelineStage(stage);
  return legacyJobStatusToPipelineStage(String(raw.status ?? "New"));
}

/** Map import-channel label to jobs page source filter. */
export function importChannelToSourceFilter(source: string): string {
  const map: Record<string, string> = {
    LinkedIn: "LinkedIn",
    Gmail: "Gmail",
    Indeed: "Indeed",
    StepStone: "Stepstone",
    Xing: "Xing",
    Manual: "Manual",
    Other: "Other",
  };
  return map[source] ?? source;
}
