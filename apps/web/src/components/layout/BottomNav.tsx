"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, JobsIcon, ApplicationsIcon, DocumentsIcon, UserIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/today", icon: DashboardIcon, labelKey: "nav.today" },
  { href: "/jobs", icon: JobsIcon, labelKey: "nav.jobs" },
  { href: "/applications", icon: ApplicationsIcon, labelKey: "nav.applications" },
  { href: "/documents", icon: DocumentsIcon, labelKey: "nav.documents" },
  { href: "/profile", icon: UserIcon, labelKey: "nav.profile" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--bg-1)]/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex min-h-[var(--mobile-nav-height)] items-stretch">
        {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-center transition-colors mobile-touch-target",
                isActive
                  ? "text-[var(--accent-hi)]"
                  : "text-[var(--text-4)] hover:text-[var(--text-2)]"
              )}
            >
              <Icon size={22} />
              <span className="max-w-[4.5rem] truncate text-[10px] font-medium leading-tight sm:max-w-none">{t(labelKey)}</span>
              {isActive ? (
                <span className="absolute bottom-1 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-[var(--accent-hi)]" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
