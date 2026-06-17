import type { Metadata } from "next";
import { DashboardPageClient } from "@/components/dashboard/DashboardPageClient";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return <DashboardPageClient />;
}
