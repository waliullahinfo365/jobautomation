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
      <div className="flex h-[56px] items-stretch">
        {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-center transition-colors",
                isActive
                  ? "text-[var(--accent-hi)]"
                  : "text-[var(--text-4)] hover:text-[var(--text-2)]"
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium leading-tight">{t(labelKey)}</span>
              {isActive && (
                <span className="absolute bottom-0 h-[2px] w-8 rounded-full bg-[var(--accent-hi)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
