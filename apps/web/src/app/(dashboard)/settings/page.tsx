import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading settings…</div>}>
      <SettingsPageClient />
    </Suspense>
  );
}
