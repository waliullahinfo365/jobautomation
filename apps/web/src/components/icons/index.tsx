/**
 * NewJob Guru — Custom Icon System
 * ──────────────────────────────────────────────
 * Drop this file at: src/components/icons/index.tsx (or .jsx)
 *
 * Design rules:
 *   • 24×24 viewBox · 1.5px stroke · round caps & joins
 *   • Outline language with accent geometric details
 *   • All icons accept { size, strokeWidth, className, ...props }
 *   • Designed as a cohesive set — do not mix with third-party icons
 *
 * Usage:
 *   import { DashboardIcon, JobsIcon } from "@/components/icons";
 *   <DashboardIcon size={18} className="text-accent" />
 */

import * as React from "react";

import { Icon, type IconProps } from "./iconBase";

export type { IconProps } from "./iconBase";
export { Icon } from "./iconBase";

/* =============================================================
   SIDEBAR / FEATURE ICONS
   ============================================================= */

export const DashboardIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="7.5" height="9" rx="1.6" />
    <rect x="13" y="3.5" width="7.5" height="5.5" rx="1.6" />
    <rect x="3.5" y="14" width="7.5" height="6.5" rx="1.6" />
    <rect x="13" y="10.5" width="7.5" height="10" rx="1.6" />
  </Icon>
);

export const JobsIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2.2" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
    <path d="M3 12.5h18" />
    <path d="M11 11.5v2" />
    <path d="M13 11.5v2" />
  </Icon>
);

export const ApplicationsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 4h7l4 4v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    <path d="M14 4v4h4" />
    <path d="M8.5 13.5h2l1.5-3 2 5 1.5-2h1.5" />
  </Icon>
);

export const ContactsIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9.5" cy="9" r="3.2" />
    <path d="M3.5 19.5c.7-3.1 3.1-5 6-5s5.3 1.9 6 5" />
    <path d="M16 5.2a3 3 0 0 1 0 6" />
    <path d="M16.5 14.7c2.4.4 4.2 2.1 4.7 4.8" />
  </Icon>
);

export const InterviewsIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
    <path d="M3.5 10h17" />
    <path d="M8 3.5v3M16 3.5v3" />
    <path d="m9 14.5 2 2 4-4" />
  </Icon>
);

export const DocumentsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10.5Z" />
    <path d="M3.5 11.5h17" />
  </Icon>
);

export const ReportsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 20.5h17" />
    <rect x="6" y="12" width="3" height="6" rx="0.6" />
    <rect x="11" y="8" width="3" height="10" rx="0.6" />
    <rect x="16" y="4.5" width="3" height="13.5" rx="0.6" />
  </Icon>
);

export const AutomationIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13 3 5.5 13.2a.6.6 0 0 0 .5 1H11l-1 6.8 7.5-10.2a.6.6 0 0 0-.5-1H13l0-6.8Z" />
    <circle cx="20" cy="6" r="1.2" />
    <circle cx="20" cy="18" r="1.2" />
  </Icon>
);

export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z" />
    <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V20a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H4a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3h.1a1.6 1.6 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7v.1a1.6 1.6 0 0 0 1.5 1H20a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
  </Icon>
);

export const DemoIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m10.5 9 5 3-5 3v-6Z" />
  </Icon>
);

export const StatusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 12h3l2.5-5 4 10 2.5-5h6" />
  </Icon>
);

/* =============================================================
   TOPBAR / ACTION ICONS
   ============================================================= */

export const SearchIcon = (p: IconProps) => (
  <Icon strokeWidth={1.6} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4-4" />
  </Icon>
);

export const NotificationIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" />
    <path d="M10 19.5a2 2 0 0 0 4 0" />
  </Icon>
);

export const ThemeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10Z" />
  </Icon>
);

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon strokeWidth={1.8} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon strokeWidth={1.6} {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Icon strokeWidth={1.6} {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);

export const HealthCheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21s-7.5-4.7-7.5-10.5A4.5 4.5 0 0 1 12 6.5a4.5 4.5 0 0 1 7.5 4c0 5.8-7.5 10.5-7.5 10.5Z" />
    <path d="M8.5 11.5h2l1.5-3 2 5 1-2" />
  </Icon>
);

export const SparkleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2" />
  </Icon>
);

export const UserIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20.5c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5" />
  </Icon>
);

/* =============================================================
   KPI / CONTENT ICONS
   ============================================================= */

export const TrackedJobsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9.5h16" />
    <rect x="4" y="6" width="16" height="14" rx="2.2" />
    <path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6" />
    <circle cx="12" cy="13.5" r="1.2" />
  </Icon>
);

export const SendIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m4 12 16-7-7 16-2.5-6L4 12Z" />
    <path d="m10.5 13.5 2.5-2.5" />
  </Icon>
);

export const CalendarCheckIcon = InterviewsIcon;

export const TrophyIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M7 6H4.5v2A2.5 2.5 0 0 0 7 10.5" />
    <path d="M17 6h2.5v2A2.5 2.5 0 0 1 17 10.5" />
    <path d="M9.5 14h5l-.5 3.5h-4L9.5 14Z" />
    <path d="M8 20.5h8" />
  </Icon>
);

export const FollowUpIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5.5 17h11" />
    <path d="M7 17v-5a5 5 0 0 1 10 0v5" />
    <circle cx="17.5" cy="17.5" r="3.5" />
    <path d="M17.5 16v1.5l1 1" />
    <path d="M10 19.5a2 2 0 0 0 4 0" />
  </Icon>
);

export const BotIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="8" width="16" height="11" rx="2.5" />
    <circle cx="9" cy="13.5" r="1.1" />
    <circle cx="15" cy="13.5" r="1.1" />
    <path d="M12 4.5v3.5" />
    <circle cx="12" cy="3.5" r="1.2" />
    <path d="M2 13v3M22 13v3" />
  </Icon>
);

export const PipelineIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="6" width="6" height="12" rx="1.2" />
    <rect x="11" y="9" width="6" height="9" rx="1.2" />
    <rect x="19" y="12" width="2" height="6" rx="0.8" opacity="0.7" />
  </Icon>
);

export const DeadlineIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12.5" r="7.5" />
    <path d="M12 8v4.5l3 1.8" />
    <path d="M9 3.5h6" />
  </Icon>
);

export const LiveIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="2" />
    <path d="M8.5 8.5a5 5 0 0 0 0 7" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M5.5 5.5a9 9 0 0 0 0 13" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </Icon>
);

export const TrendUpIcon = (p: IconProps) => (
  <Icon strokeWidth={2} {...p}>
    <path d="M5 17 11 11l3 3 6-6" />
    <path d="M14 8h6v6" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon strokeWidth={1.8} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

/* =============================================================
   BRAND MARK
   ============================================================= */

export const BrandMark = (p: IconProps) => (
  <Icon strokeWidth={1.6} {...p}>
    <path d="M5 8.5 12 4l7 4.5v7L12 20l-7-4.5v-7Z" />
    <path d="M9.5 11.5h5" />
    <path d="M9.5 14.5h3" />
  </Icon>
);

/* =============================================================
   NAV CONFIG — drop straight into your sidebar
   ============================================================= */

export const SIDEBAR_NAV = [
  {
    sectionKey: "navSection.workspace",
    items: [
      { labelKey: "nav.dashboard", icon: DashboardIcon, href: "/dashboard" },
      { labelKey: "nav.jobs", icon: JobsIcon, href: "/jobs", badge: 12 },
      { labelKey: "nav.applications", icon: ApplicationsIcon, href: "/applications" },
      { labelKey: "nav.contacts", icon: ContactsIcon, href: "/contacts" },
      { labelKey: "nav.interviews", icon: InterviewsIcon, href: "/interviews", badge: 2 },
      { labelKey: "nav.documents", icon: DocumentsIcon, href: "/documents" },
    ],
  },
  {
    sectionKey: "navSection.insights",
    items: [
      { labelKey: "nav.reports", icon: ReportsIcon, href: "/reports" },
      { labelKey: "nav.automation", icon: AutomationIcon, href: "/automation" },
    ],
  },
  {
    sectionKey: "navSection.account",
    items: [
      { labelKey: "nav.settings", icon: SettingsIcon, href: "/settings" },
      { labelKey: "nav.demo", icon: DemoIcon, href: "/demo" },
      { labelKey: "nav.systemStatus", icon: StatusIcon, href: "/system-status" },
    ],
  },
] as const;

export type SidebarNavItem = (typeof SIDEBAR_NAV)[number]["items"][number];

export * from "./moreIcons";
