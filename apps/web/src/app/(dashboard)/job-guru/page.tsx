import type { Metadata } from "next";
import { JobGuruPageClient } from "@/components/job-guru/JobGuruPageClient";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: BRAND.productName };

export default function JobGuruPage() {
  return <JobGuruPageClient />;
}
