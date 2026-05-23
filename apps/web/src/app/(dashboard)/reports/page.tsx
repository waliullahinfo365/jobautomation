import type { Metadata } from "next";
import { ReportsPageClient } from "@/components/reports/ReportsPageClient";

export const metadata: Metadata = { title: "Insights" };

export default function ReportsPage() {
  return <ReportsPageClient />;
}
