import type { ComponentType } from "react";
import {
  ApplicationsIcon,
  AutomationIcon,
  ContactsIcon,
  DashboardIcon,
  DocumentsIcon,
  InterviewsIcon,
  JobsIcon,
  ReportsIcon,
  SettingsIcon,
  StatusIcon,
  UserIcon,
  type IconProps,
} from "@/components/icons";
import { isAdvancedUiEnabled, isSuperAdmin, type ProductRole } from "@/config/productMode";

export type AppNavItem = {
  id?: string;
  href: string;
  labelKey: string;
  shortLabelKey?: string;
  icon: ComponentType<IconProps>;
  /** Extra path prefixes that should mark this item active (e.g. nested apply flow). */
  activePrefixes?: readonly string[];
};

/** Simplified mobile-first navigation for normal customers. */
export const CUSTOMER_NAV_ITEMS: readonly AppNavItem[] = [
  { href: "/today", labelKey: "nav.today", shortLabelKey: "nav.todayShort", icon: DashboardIcon },
  { href: "/jobs", labelKey: "nav.inbox", shortLabelKey: "nav.inboxShort", icon: JobsIcon },
  {
    href: "/apply-assistant",
    labelKey: "nav.apply",
    shortLabelKey: "nav.applyShort",
    icon: AutomationIcon,
    activePrefixes: ["/apply-assistant"],
  },
  { href: "/documents", labelKey: "nav.docs", shortLabelKey: "nav.docsShort", icon: DocumentsIcon },
  { href: "/settings", labelKey: "nav.settings", shortLabelKey: "nav.settingsShort", icon: SettingsIcon },
];

/** Mobile bottom bar — settings live in the hamburger menu. */
export const CUSTOMER_BOTTOM_NAV_ITEMS: readonly AppNavItem[] = CUSTOMER_NAV_ITEMS.filter(
  (item) => item.href !== "/settings"
);

/** Full operator navigation for super admins. */
export const SUPER_ADMIN_NAV_ITEMS: readonly AppNavItem[] = [
  { href: "/today", labelKey: "nav.today", icon: DashboardIcon },
  { href: "/jobs", labelKey: "nav.jobInbox", icon: JobsIcon },
  { href: "/applications", labelKey: "nav.applications", icon: ApplicationsIcon },
  { href: "/documents", labelKey: "nav.documents", icon: DocumentsIcon },
  { href: "/contacts", labelKey: "nav.contacts", icon: ContactsIcon },
  { href: "/interviews", labelKey: "nav.interviews", icon: InterviewsIcon },
  { href: "/insights", labelKey: "nav.insights", icon: ReportsIcon },
  { href: "/automation", labelKey: "nav.automation", icon: AutomationIcon },
  { href: "/reports", labelKey: "nav.reports", icon: ReportsIcon },
  { id: "users", href: "/settings", labelKey: "nav.users", icon: UserIcon },
  { id: "settings", href: "/settings", labelKey: "nav.settings", icon: SettingsIcon },
  { href: "/system-status", labelKey: "nav.systemStatus", icon: StatusIcon },
];

/** Super admin primary landing — listed first in operator nav. */
export const SUPER_ADMIN_HOME = "/super-admin" as const;

export const SUPER_ADMIN_NAV_ITEMS_ORDERED: readonly AppNavItem[] = [
  { href: "/super-admin", labelKey: "nav.superAdmin", icon: SettingsIcon },
  ...SUPER_ADMIN_NAV_ITEMS.filter((item) => item.href !== "/super-admin"),
];

export function shouldUseCustomerNav(productRole: ProductRole): boolean {
  if (isSuperAdmin(productRole)) return false;
  if (isAdvancedUiEnabled(productRole)) return false;
  return true;
}

export function getSidebarNavItems(productRole: ProductRole): readonly AppNavItem[] {
  if (isSuperAdmin(productRole)) return SUPER_ADMIN_NAV_ITEMS_ORDERED;
  return shouldUseCustomerNav(productRole) ? CUSTOMER_NAV_ITEMS : SUPER_ADMIN_NAV_ITEMS_ORDERED;
}

export function getBottomNavItems(productRole: ProductRole): readonly AppNavItem[] {
  if (isSuperAdmin(productRole)) return [];
  return CUSTOMER_BOTTOM_NAV_ITEMS;
}

export function getMobileDrawerNavItems(productRole: ProductRole): readonly AppNavItem[] {
  if (shouldUseCustomerNav(productRole)) return [];
  return SUPER_ADMIN_NAV_ITEMS_ORDERED;
}

const APPLY_JOB_PATH = /^\/jobs\/[^/]+\/apply(?:\/|$)/;

export function isNavItemActive(pathname: string, item: AppNavItem): boolean {
  if (item.href === "/apply-assistant" || item.activePrefixes?.includes("/apply-assistant")) {
    if (pathname === "/apply-assistant" || APPLY_JOB_PATH.test(pathname)) return true;
  }

  if (item.href === "/jobs") {
    if (pathname === "/jobs" || pathname.startsWith("/jobs/")) {
      return !APPLY_JOB_PATH.test(pathname);
    }
    return false;
  }

  if (item.activePrefixes?.length) {
    for (const prefix of item.activePrefixes) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return true;
    }
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getNavTitleForPath(
  pathname: string,
  productRole: ProductRole,
  t: (key: string) => string
): string {
  const items = [...getSidebarNavItems(productRole), ...SUPER_ADMIN_NAV_ITEMS];
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    if (isNavItemActive(pathname, item)) return t(item.labelKey);
  }
  if (pathname.startsWith("/settings")) return t("nav.settings");
  if (pathname.startsWith("/billing")) return t("nav.settings");
  return t("nav.dashboard");
}

/** @deprecated Use `getSidebarNavItems` — kept for legacy imports. */
export const SIDEBAR_NAV_PRIMARY = [
  {
    sectionKey: "navSection.main",
    items: CUSTOMER_NAV_ITEMS.map((item) => ({
      labelKey: item.labelKey,
      icon: item.icon,
      href: item.href,
    })),
  },
] as const;

export const SIDEBAR_NAV_SECONDARY = [
  {
    sectionKey: "navSection.more",
    items: SUPER_ADMIN_NAV_ITEMS.filter((item) => item.href !== "/today").map((item) => ({
      labelKey: item.labelKey,
      icon: item.icon,
      href: item.href,
    })),
  },
] as const;

export const SIDEBAR_NAV = [...SIDEBAR_NAV_PRIMARY, ...SIDEBAR_NAV_SECONDARY] as const;

export type SidebarNavItem = (typeof SIDEBAR_NAV)[number]["items"][number];
