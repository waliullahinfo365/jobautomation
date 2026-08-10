"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuthSession } from "@/context/AuthSessionContext";
import { getBottomNavItems, isNavItemActive } from "@/config/navigation";
import { cn } from "@/lib/utils";

function navItemKey(item: { id?: string; href: string }): string {
  return item.id ?? item.href;
}

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const authSession = useAuthSession();
  const productRole = authSession?.productRole ?? "user";
  const navItems = getBottomNavItems(productRole);

  if (navItems.length === 0) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--bg-1)]/95 shadow-[0_-8px_32px_-12px_rgba(0,0,0,0.35)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label={t("nav.mobileBottom")}
    >
      <div className="flex h-[var(--mobile-nav-height)] items-stretch px-0.5">
        {navItems.map((item) => {
          const isActive = isNavItemActive(pathname, item);
          const Icon = item.icon;
          const labelKey = item.shortLabelKey ?? item.labelKey;
          return (
            <Link
              key={navItemKey(item)}
              href={item.href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-center transition-colors mobile-touch-target active:bg-[var(--surface-3)]",
                isActive ? "text-[var(--accent-hi)]" : "text-[var(--text-4)]"
              )}
            >
              <Icon size={20} />
              <span className="w-full truncate px-0.5 text-[10px] font-medium leading-tight tracking-tight min-[380px]:text-[11px]">
                {t(labelKey)}
              </span>
              {isActive ? (
                <span className="absolute bottom-1 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-[var(--accent-hi)] min-[380px]:w-6" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
