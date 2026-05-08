"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark, SIDEBAR_NAV, type SidebarNavItem } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";

const flatNav: SidebarNavItem[] = SIDEBAR_NAV.flatMap((s) => [...s.items]);

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <>
      <header className="jf-mobile-topbar flex min-h-[52px] items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-1)] px-3 py-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md sm:min-h-[56px] sm:px-4 md:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="jf-brand-mark shrink-0 text-white">
            <BrandMark size={14} className="relative z-[1]" />
          </div>
          <span className="truncate text-sm font-semibold text-[var(--text-1)]">{APP_NAME}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-10 min-h-[40px] min-w-[40px] place-items-center rounded-md text-[var(--text-2)]"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden />
          <nav className="fixed right-0 top-0 flex h-full w-[min(100vw-2.5rem,18rem)] max-w-full flex-col border-l border-[var(--border-default)] bg-[var(--surface-1)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="font-semibold text-[var(--text-1)]">{APP_NAME}</span>
              <button type="button" onClick={() => setOpen(false)} className="text-[var(--text-3)]" aria-label={t("common.close")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <ul className="flex flex-col gap-1 overflow-y-auto">
              {flatNav.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                        isActive
                          ? "bg-[var(--accent-bg)] text-[var(--text-1)]"
                          : "text-[var(--text-2)] hover:bg-[var(--surface-3)]"
                      )}
                    >
                      <Icon size={16} />
                      {t(item.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
