import type { Metadata } from "next";
import { ApplicationsPageClient } from "@/components/applications/ApplicationsPageClient";

export const metadata: Metadata = { title: "Applications" };

export default function ApplicationsPage() {
  return <ApplicationsPageClient />;
}
