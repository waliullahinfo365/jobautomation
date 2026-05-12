import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";
import { SettingsFallback } from "@/components/settings/SettingsFallback";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsPageClient />
    </Suspense>
  );
}
