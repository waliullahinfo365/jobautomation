"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { SIDEBAR_NAV, type SidebarNavItem } from "@/components/icons";
import { BRAND } from "@/lib/brand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { me } from "@/lib/api/auth.api";
import { useLogoutAction } from "@/hooks/useLogoutAction";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";
import { MobileSearchSheet } from "./MobileSearchSheet";
import { ThemeToggle } from "./ThemeToggle";
import { SearchIcon, PlusIcon } from "@/components/icons";
import { useTheme } from "next-themes";

const flatNav: SidebarNavItem[] = SIDEBAR_NAV.flatMap((s) => [...s.items]);

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [account, setAccount] = useState<{ name: string; email: string } | null>(null);
  const pathname = usePathname();
  const { t } = useTranslation();
  const { theme, resolvedTheme } = useTheme();
  const handleLogout = useLogoutAction(() => setOpen(false));
  const isDark = (resolvedTheme ?? theme ?? "light") === "dark";
  const initials = useMemo(() => {
    const source = account?.name || account?.email || t("topbar.you");
    const parts = source.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase();
  }, [account, t]);

  useEffect(() => {
    if (!open || account) return;
    let mounted = true;
    void me()
      .then((session) => {
        if (!mounted) return;
        setAccount({
          name: session.user?.name || t("topbar.you"),
          email: session.user?.email || "",
        });
      })
      .catch(() => {
        if (!mounted) return;
        setAccount({ name: t("topbar.you"), email: "" });
      });
    return () => {
      mounted = false;
    };
  }, [account, open, t]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <header className="jf-mobile-topbar flex min-h-[52px] items-center justify-between gap-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-1)] px-2.5 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md sm:gap-2 sm:px-4 md:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Image src={BRAND.iconPath} alt={BRAND.name} width={26} height={26} priority className="shrink-0" />
          <span className="max-w-[7rem] truncate text-sm font-semibold text-[var(--text-1)] sm:max-w-none">{BRAND.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="grid h-11 min-h-[44px] min-w-[44px] place-items-center rounded-md text-[var(--text-2)]"
            aria-label={t("topbar.searchPlaceholder")}
          >
            <SearchIcon size={20} />
          </button>
          <Link
            href="/jobs?add=1"
            className="grid h-11 min-h-[44px] min-w-[44px] place-items-center rounded-md text-[var(--text-2)]"
            aria-label={t("jobs.addJob")}
          >
            <PlusIcon size={20} />
          </Link>
          <NotificationBell />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-11 min-h-[44px] min-w-[44px] place-items-center rounded-md text-[var(--text-2)]"
            aria-label={t("common.openMenu")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <nav
            className="absolute right-0 top-0 flex h-full w-[min(420px,85vw)] max-w-full flex-col border-l border-[var(--border-default)] bg-[var(--surface-1)] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={t("common.openMenu")}
          >
            <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
              <span className="font-semibold text-[var(--text-1)]">{BRAND.name}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-11 min-h-[44px] min-w-[44px] place-items-center rounded-md text-[var(--text-3)] hover:bg-[var(--surface-3)]"
                aria-label={t("common.close")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <div className="mb-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0 border-0 bg-gradient-to-br from-[#4FC2D8] to-[#637CFF] text-xs font-bold text-white">
                    <AvatarFallback className="bg-transparent text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--text-1)]">{account?.name ?? t("topbar.you")}</p>
                    {account?.email ? <p className="truncate text-xs text-[var(--text-3)]">{account.email}</p> : null}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex min-h-[40px] items-center justify-center rounded-md border border-[var(--border-default)] px-3 text-sm font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
                  >
                    {t("common.profile")}
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="flex min-h-[40px] items-center justify-center rounded-md border border-[var(--border-default)] px-3 text-sm font-medium text-[var(--text-2)] hover:bg-[var(--surface-3)]"
                  >
                    {t("common.settings")}
                  </Link>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-[var(--border-default)] px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--text-3)]">{t("language.label")}</p>
                  </div>
                  <LanguageSwitcher compact />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-[var(--border-default)] px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--text-3)]">{t("common.design")}</p>
                    <p className="truncate text-sm text-[var(--text-1)]">
                      {isDark ? t("common.darkMode") : t("common.lightMode")}
                    </p>
                  </div>
                  <ThemeToggle className="h-10 w-10 min-h-[40px] min-w-[40px]" />
                </div>
              </div>

              <ul className="flex flex-col gap-1">
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
            </div>

            <div className="border-t border-[var(--border-default)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px] w-full justify-center border-rose-500/40 text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
                onClick={handleLogout}
              >
                {t("common.logout")}
              </Button>
            </div>
          </nav>
        </div>
      )}
      <MobileSearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
