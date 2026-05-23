"use client";

import { useTheme } from "next-themes";
import { PageTransition } from "@/components/shared/PageTransition";
import { cn } from "@/lib/utils";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { resolvedTheme } = useTheme();
  const themeClass = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div className={cn("dashboard-bg", themeClass)} suppressHydrationWarning>
      <div className="jf-app-bg" aria-hidden />
      <div className="jf-app-grain" aria-hidden />
      <div className="jf-shell">
        <Sidebar />
        <div className="flex min-w-0 flex-col bg-[var(--bg-0)]">
          <MobileNav />
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <PageTransition>
              <div className="mx-auto w-full min-w-0 max-w-[1480px] px-3 py-5 pb-[calc(1.25rem+56px)] sm:px-5 sm:py-6 sm:pb-[calc(1.5rem+56px)] md:px-6 md:py-7 md:pb-7 lg:px-7">{children}</div>
            </PageTransition>
          </main>
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
