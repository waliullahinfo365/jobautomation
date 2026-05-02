import type { Metadata } from "next";
import { JobDetailPageClient } from "@/components/jobs/JobDetailPageClient";

export const metadata: Metadata = { title: "Job Detail" };

interface JobDetailPageProps {
  params: { id: string };
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  return <JobDetailPageClient id={params.id} />;
}
