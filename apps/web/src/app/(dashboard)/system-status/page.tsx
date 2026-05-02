import type { Metadata } from "next";
import { SystemStatusClient } from "@/components/system/SystemStatusClient";

export const metadata: Metadata = {
  title: "System Status",
};

export default function SystemStatusPage() {
  return <SystemStatusClient />;
}
