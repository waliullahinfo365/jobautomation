"use client";

import { useTheme } from "next-themes";
import { PageTransition } from "@/components/shared/PageTransition";
import { cn } from "@/lib/utils";
import { useAuthSession } from "@/context/AuthSessionContext";
import { getBottomNavItems } from "@/config/navigation";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";
import { JobPipelineSummaryProvider } from "@/context/JobPipelineSummaryContext";
import { PushNotificationPrompt } from "@/components/shared/PushNotificationPrompt";
import { PwaInstallPrompt } from "@/components/shared/PwaInstallPrompt";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { resolvedTheme } = useTheme();
  const themeClass = resolvedTheme === "dark" ? "dark" : "light";
  const authSession = useAuthSession();
  const productRole = authSession?.productRole ?? "user";
  const hasMobileBottomNav = getBottomNavItems(productRole).length > 0;

  return (
    <JobPipelineSummaryProvider>
      <div className={cn("dashboard-bg", themeClass)} suppressHydrationWarning>
        <div className="jf-app-bg" aria-hidden />
        <div className="jf-app-grain" aria-hidden />
        <div className="jf-shell">
          <Sidebar />
          <div className="flex min-w-0 flex-col overflow-x-hidden bg-[var(--bg-0)] md:min-h-screen">
            <MobileNav />
            <Topbar />
            <main className="flex-1 overflow-x-clip">
              <PageTransition>
                <div
                  className={cn(
                    "mx-auto w-full min-w-0 max-w-[1480px] overflow-x-clip px-4 py-4 sm:px-5 sm:py-6 md:px-6 md:py-7 lg:px-7",
                    hasMobileBottomNav
                      ? "pb-mobile-shell"
                      : "pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-7"
                  )}
                >
                  <div className="mb-4 space-y-3">
                    <PwaInstallPrompt />
                    <PushNotificationPrompt />
                  </div>
                  {children}
                </div>
              </PageTransition>
            </main>
            <BottomNav />
          </div>
        </div>
      </div>
    </JobPipelineSummaryProvider>
  );
}
