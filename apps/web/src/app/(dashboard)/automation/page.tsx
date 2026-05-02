import type { Metadata } from "next";
import { AutomationPageClient } from "@/components/automation/AutomationPageClient";

export const metadata: Metadata = { title: "Automation" };

export default function AutomationPage() {
  return <AutomationPageClient />;
}
