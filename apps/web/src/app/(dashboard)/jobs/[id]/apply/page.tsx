import type { Metadata } from "next";
import { ManualApplyAssistantClient } from "@/components/jobs/ManualApplyAssistantClient";

export const metadata: Metadata = { title: "Apply Assistant" };

export default function JobApplyPage() {
  return <ManualApplyAssistantClient />;
}
