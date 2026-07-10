import { resolvePipelineStage, type PipelineStage } from "@/lib/jobs/pipeline-stage";
import type { Job } from "@/types/job";

const STICKY_STAGES: PipelineStage[] = ["Ready", "Applied", "Interview", "Offer"];

export function shouldShowApplyStickyBar(job: Job): boolean {
  const stage = resolvePipelineStage(job);
  return STICKY_STAGES.includes(stage);
}
