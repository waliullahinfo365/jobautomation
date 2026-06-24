"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, JobsIcon, ApplicationsIcon, DocumentsIcon, UserIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/today", icon: DashboardIcon, labelKey: "nav.today", shortLabelKey: "nav.todayShort" },
  { href: "/jobs", icon: JobsIcon, labelKey: "nav.jobs", shortLabelKey: "nav.jobsShort" },
  { href: "/applications", icon: ApplicationsIcon, labelKey: "nav.applications", shortLabelKey: "nav.applicationsShort" },
  { href: "/documents", icon: DocumentsIcon, labelKey: "nav.documents", shortLabelKey: "nav.documentsShort" },
  { href: "/profile", icon: UserIcon, labelKey: "nav.profile", shortLabelKey: "nav.profileShort" },
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
        {NAV_ITEMS.map(({ href, icon: Icon, labelKey, shortLabelKey }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-center transition-colors mobile-touch-target",
                isActive
                  ? "text-[var(--accent-hi)]"
                  : "text-[var(--text-4)] hover:text-[var(--text-2)]"
              )}
            >
              <Icon size={22} />
              <span className="w-full truncate px-0.5 text-[9px] font-medium leading-tight min-[400px]:text-[10px]">
                <span className="min-[420px]:hidden">{t(shortLabelKey)}</span>
                <span className="hidden min-[420px]:inline">{t(labelKey)}</span>
              </span>
              {isActive ? (
                <span className="absolute bottom-1 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-[var(--accent-hi)] min-[400px]:w-8" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
