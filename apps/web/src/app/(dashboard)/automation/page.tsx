import type { Metadata } from "next";
import { AutomationPageClient } from "@/components/automation/AutomationPageClient";

export const metadata: Metadata = { title: "Job Assistant" };

export default function AutomationPage() {
  return <AutomationPageClient />;
}
