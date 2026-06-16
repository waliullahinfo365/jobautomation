import type { Metadata } from "next";
import { AutomationPageClient } from "@/components/automation/AutomationPageClient";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: BRAND.productName };

export default function AutomationPage() {
  return <AutomationPageClient />;
}
