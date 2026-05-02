import type { Metadata } from "next";
import { InterviewsPageClient } from "@/components/interviews/InterviewsPageClient";

export const metadata: Metadata = { title: "Interviews" };

export default function InterviewsPage() {
  return <InterviewsPageClient />;
}
