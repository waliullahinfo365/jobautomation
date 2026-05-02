/**
 * Additional UI icons — same stroke/cap rules as the core set.
 */
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconProps } from "./iconBase";

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon strokeWidth={2} {...p}>
    <path d="M5 12.5l4 4L19 7" />
  </Icon>
);

export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M21 21v-5h-5" />
  </Icon>
);

export const LoaderIcon = ({ className, ...p }: IconProps) => (
  <Icon {...p} className={cn("animate-spin", className)}>
    <path d="M12 2v4" />
    <path d="M12 18v4" opacity="0.3" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" opacity="0.5" />
    <path d="M18 12h4" opacity="0.5" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
  </Icon>
);

export const MoreIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </Icon>
);

export const MapPinIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Icon>
);

export const ExternalLinkIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 3h7v7" />
    <path d="M10 14 21 3" />
    <path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" />
  </Icon>
);

export const FolderOpenIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 9.5V20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9.5" />
    <path d="M3 9.5 7.2 5.3A1 1 0 0 1 8 5h3l1.5 2H20a1 1 0 0 1 1 1v1.5" />
  </Icon>
);

export const FileTextIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8M8 17h6" />
  </Icon>
);

export const MailIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
);

export const PhoneIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.11a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92Z" />
  </Icon>
);

export const LinkedinIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 10v7M8 7.5v.01M12 17v-4.5a2 2 0 0 1 4 0V17" />
  </Icon>
);

export const BellIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </Icon>
);

export const CalendarDaysIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 11h18" />
    <path d="M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01" />
  </Icon>
);

export const CheckCircleIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.5 2.5 2.5 5-5" />
  </Icon>
);

export const CircleDotIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
  </Icon>
);

export const LayoutListIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M4 6h.01M4 12h.01M4 18h.01" />
  </Icon>
);

export const PanelsTopLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Icon>
);

/* —— Automation module keys —— */

export const InboxIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 4h16v6l-8 5-8-5V4Z" />
    <path d="M22 10v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V10" />
  </Icon>
);

export const ShieldCheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3 4.5 6.5V12a8 8 0 0 0 7.5 8 8 8 0 0 0 7.5-8V6.5L12 3Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

export const FileInputIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
    <path d="M14 2v6h6" />
    <path d="M12 11v6" />
    <path d="m9.5 14.5 2.5-2.5 2.5 2.5" />
  </Icon>
);

export const MailCheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
    <path d="m9 14 2 2 4-4" />
  </Icon>
);

export const BellRingIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
    <path d="M18 3a3 3 0 0 1 0 6" />
  </Icon>
);

export const FileDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
    <path d="M14 2v6h6" />
    <path d="M12 18V9" />
    <path d="m9 15 3 3 3-3" />
  </Icon>
);

export const FileSearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
    <path d="M14 2v6h6" />
    <circle cx="11.5" cy="14.5" r="3.5" />
    <path d="m16 19 2 2" />
  </Icon>
);

export const SparklesIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.5 2.5 11 8l5.5 1.5-5.5 1.5-1.5 5.5L8 14l-5.5-1.5L8 11 9.5 5.5Z" />
    <path d="M19 14l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
  </Icon>
);

export const UsersIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20.5c.5-3.5 3-5.5 6-5.5s5.5 2 6 5.5" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M21 20.5c-.3-2.5-2-4-4-4" />
  </Icon>
);

export const BadgeCheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.5 2 2 5-5" />
    <path d="M8 4h2l1-2h4l1 2h2" />
  </Icon>
);

export const AlarmClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 9.5V13l3 2" />
    <path d="M5 3 2 6M19 3l3 3" />
  </Icon>
);

export const ActivityIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />
  </Icon>
);

export const NewspaperIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 0-2-2V4Z" />
    <path d="M18 4h2a2 2 0 0 1 2 2v12" />
    <path d="M8 8h4M8 12h6" />
  </Icon>
);

export const BarChart3Icon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 20h18" />
    <path d="M6 16v-6M12 16V8M18 16v-9" />
  </Icon>
);

export const EyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

export const CalendarClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 11h18" />
    <circle cx="12" cy="15" r="3.5" />
    <path d="M12 13.5V15l1.5 1" />
  </Icon>
);

export const AlertTriangleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3 2 20h20L12 3Z" />
    <path d="M12 9v5M12 17h.01" />
  </Icon>
);

export const PlayIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 5v14l11-7-11-7Z" fill="currentColor" stroke="none" />
  </Icon>
);

export const RotateCcwIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </Icon>
);

export const XCircleIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15 9-6 6M9 9l6 6" />
  </Icon>
);

export const CircleDashedIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" strokeDasharray="3 3" />
  </Icon>
);

export const WrenchIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2 2 0 0 1-2.83-2.83l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
  </Icon>
);

export const PlayCircleIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M10 8.5v7l5.5-3.5L10 8.5Z" fill="currentColor" stroke="none" />
  </Icon>
);

export const GaugeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    <path d="M19.4 15a8 8 0 1 0-14.8 0" />
    <path d="M12 11V7" />
  </Icon>
);

export const HandCoinsIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M11 15h8a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2" />
    <path d="M5 12v7a2 2 0 0 0 2 2h2" />
    <circle cx="8" cy="8" r="3" />
    <path d="M12 6h3l2-3 2 6" />
  </Icon>
);

export const ReplyIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 18v-2a4 4 0 0 0-4-4H8" />
    <path d="M8 8 4 12l4 4" />
  </Icon>
);

export const Clock3Icon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v6l4 2" />
  </Icon>
);

export const Link2Icon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
    <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
    <path d="M8 12h8" />
  </Icon>
);

export const ClipboardCheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

export const FileBarChart2Icon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
    <path d="M14 2v6h6" />
    <path d="M8 18v-4M12 18v-7M16 18V9" />
  </Icon>
);

export const ZapIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" fill="currentColor" stroke="none" />
  </Icon>
);

export const ServerIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="6" rx="1.5" />
    <rect x="3" y="14" width="18" height="6" rx="1.5" />
    <path d="M7 7h.01M7 17h.01" />
  </Icon>
);

export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3 4.5 6.5V12a8 8 0 0 0 7.5 8 8 8 0 0 0 7.5-8V6.5L12 3Z" />
  </Icon>
);

export const HardDriveIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8H4V8Z" />
    <path d="M8 18h8M10 14h4" />
  </Icon>
);

export const DatabaseIcon = (p: IconProps) => (
  <Icon {...p}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5" />
    <path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6" />
  </Icon>
);

export const MessageSquareIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
  </Icon>
);

export const FilesIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6h7l3 3v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
    <path d="M13 6V3a2 2 0 0 1 2-2h3l3 3v9" />
  </Icon>
);

export const FileBadge2Icon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
    <path d="M14 2v6h6" />
    <circle cx="10" cy="13" r="2" />
  </Icon>
);

export const BookOpenTextIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 4h7a2 2 0 0 1 2 2v14l-5-3-5 3V6a2 2 0 0 1 2-2Z" />
    <path d="M20 4h-7a2 2 0 0 0-2 2v14l5-3 5 3V6a2 2 0 0 0-2-2Z" />
  </Icon>
);

export const FileOutputIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z" />
    <path d="M14 2v6h6" />
    <path d="M12 18V9M9 12l3-3 3 3" />
  </Icon>
);

export const UserRoundSearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10" cy="8" r="4" />
    <path d="M3 20.5c.5-3 3-5 7-5 1 0 2 .1 2.9.3" />
    <circle cx="17" cy="17" r="3" />
    <path d="m21 21-2-2" />
  </Icon>
);

export const HandshakeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M11 12h2a2 2 0 0 0 2-2V7.5" />
    <path d="M14 12V9a2 2 0 0 0-2-2l-2.5 2.5" />
    <path d="M7.5 12 6 10.5a2 2 0 0 1 0-3l1.5-1.5" />
    <path d="M13 17h2a2 2 0 0 0 2-2v-1" />
  </Icon>
);

export const MessageSquareTextIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
    <path d="M8 10h8M8 14h5" />
  </Icon>
);

export const FolderTreeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 6h3l1.5 2H19a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h2" />
    <path d="M12 12h2M12 16h4" />
  </Icon>
);

export const User2Icon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20.5c0-3.5 3.5-6 8-6s8 2.5 8 6" />
  </Icon>
);

export const BuildingIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20V9l8-4 8 4v11" />
    <path d="M9 20v-4h6v4" />
    <path d="M9 12h.01M13 12h.01" />
  </Icon>
);

export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </Icon>
);

/** Map automation API `module.icon` string keys to components */
export const AUTOMATION_MODULE_ICONS: Record<string, ComponentType<IconProps>> = {
  Inbox: InboxIcon,
  ShieldCheck: ShieldCheckIcon,
  FolderOpen: FolderOpenIcon,
  CheckCircle2: CheckCircleIcon,
  CalendarClock: CalendarClockIcon,
  FileInput: FileInputIcon,
  MailCheck: MailCheckIcon,
  BellRing: BellRingIcon,
  FileDown: FileDownIcon,
  FileSearch: FileSearchIcon,
  Sparkles: SparklesIcon,
  Users: UsersIcon,
  BadgeCheck: BadgeCheckIcon,
  AlarmClock: AlarmClockIcon,
  Activity: ActivityIcon,
  Newspaper: NewspaperIcon,
  BarChart3: BarChart3Icon,
};
