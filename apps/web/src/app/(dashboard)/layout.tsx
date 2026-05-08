"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { I18nProvider } from "@/i18n/I18nProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <I18nProvider>
        <DashboardShell>{children}</DashboardShell>
      </I18nProvider>
    </AuthGuard>
  );
}
