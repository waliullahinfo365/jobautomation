"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ChevronDownIcon, NotificationIcon, PlusIcon, SearchIcon, SIDEBAR_NAV, type SidebarNavItem } from "@/components/icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { clearAuthToken } from "@/lib/api/client";
import { showSuccess } from "@/lib/ui/toast";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const flatNav: (SidebarNavItem & { section: string })[] = SIDEBAR_NAV.flatMap((s) =>
  s.items.map((i) => ({ ...i, section: s.section }))
);

function crumbForPath(pathname: string): string {
  const match = flatNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.label ?? "Dashboard";
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const title = crumbForPath(pathname);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleLogout() {
    clearAuthToken();
    try {
      localStorage.removeItem("tenantId");
      localStorage.removeItem("userId");
      sessionStorage.removeItem("tenantId");
      sessionStorage.removeItem("userId");
    } catch {
      /* ignore */
    }
    showSuccess("Logged out successfully.");
    router.replace("/login");
  }

  return (
    <header className="jf-topbar hidden md:flex">
      <div className="jf-crumb flex items-center gap-2 text-[13px] font-medium text-[var(--text-3)]">
        <span>Workspace</span>
        <span className="text-[var(--text-5)]">›</span>
        <b className="font-semibold text-[var(--text-1)]">{title}</b>
      </div>
      <div className="flex-1" />
      <div className="relative hidden w-[340px] max-w-[35vw] items-center gap-2 rounded-[var(--r-sm)] border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-0 transition-colors focus-within:border-[var(--border-focus)] focus-within:shadow-[0_0_0_3px_rgba(99,124,255,0.12)] lg:flex lg:h-[34px]">
        <SearchIcon size={14} className="shrink-0 text-[var(--text-4)]" />
        <input
          ref={searchRef}
          type="search"
          placeholder="Search jobs, contacts, reports…"
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[var(--text-1)] placeholder:text-[var(--text-4)] outline-none"
          aria-label="Search"
        />
        <span className="inline-flex h-[18px] items-center gap-0.5 rounded border border-[var(--border-subtle)] border-b-2 bg-[var(--surface-4)] px-1.5 font-mono text-[10.5px] font-medium text-[var(--text-3)]">
          ⌘K
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative grid h-[34px] w-[34px] place-items-center rounded-[var(--r-sm)] border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-2)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
          aria-label="Notifications"
        >
          <NotificationIcon size={15} />
          <span className="absolute right-1.5 top-1.5 h-[7px] w-[7px] rounded-full bg-[var(--rose)] shadow-[0_0_0_2px_var(--surface-2)]" />
        </button>
        <ThemeToggle />
        <Link
          href="/jobs"
          className={cn(
            buttonVariants({ variant: "default", size: "default" }),
            "hidden h-[34px] bg-gradient-to-b from-[#7488FF] to-[#4D63E0] px-3 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_12px_-4px_rgba(99,124,255,0.45)] hover:from-[#8499FF] hover:to-[#5970F0] sm:inline-flex"
          )}
        >
          <PlusIcon size={14} className="mr-1.5" />
          New Job
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button
              type="button"
              className="jf-avatar-btn flex h-[34px] items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-2)] pl-1 pr-1 transition-colors hover:bg-[var(--surface-3)]"
              aria-label="Account menu"
            >
              <Avatar className="h-[26px] w-[26px] border-0 bg-gradient-to-br from-[#4FC2D8] to-[#637CFF] text-[10.5px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]">
                <AvatarFallback className="bg-transparent text-white">WU</AvatarFallback>
              </Avatar>
              <span className="jf-avatar-name text-[12.5px] font-semibold text-[var(--text-1)]">You</span>
              <ChevronDownIcon size={12} className="mr-1 text-[var(--text-3)]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() => {
                if (process.env.NODE_ENV !== "production") {
                  console.info("Navigating to /profile");
                }
                router.push("/profile");
              }}
            >
              Account / Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
