import type { Metadata } from "next";
import { DemoWalkthroughClient } from "@/components/demo/DemoWalkthroughClient";

export const metadata: Metadata = {
  title: "Demo Walkthrough",
};

export default function DemoPage() {
  return <DemoWalkthroughClient />;
}
