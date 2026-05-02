"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark, LiveIcon, SIDEBAR_NAV } from "@/components/icons";
import { useInterviewsApi } from "@/hooks/api/useInterviewsApi";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { cn } from "@/lib/utils";
import type { Interview } from "@/types/interview";
import type { Job } from "@/types/job";

export function Sidebar() {
  const pathname = usePathname();
  const jobsQ = useJobsApi({ fallbackToMock: true });
  const intQ = useInterviewsApi({ fallbackToMock: true });
  const jobsCount = normalizeListResponse<Job>(jobsQ.list).length;
  const interviewsCount = normalizeListResponse<Interview>(intQ.list).length;

  return (
    <aside className="jf-sidebar hidden md:flex">
      <div className="mb-3 border-b border-[var(--border-subtle)] pb-3.5">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="jf-brand-mark text-white">
            <BrandMark size={16} className="relative z-[1]" />
          </div>
          <div className="jf-sidebar-collapsed-text min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[13.5px] font-bold tracking-[-0.012em] text-[var(--text-1)]">JobFlow AI</span>
              <span className="rounded-full border border-[var(--accent-ring)] bg-[var(--accent-bg)] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[var(--accent-hi)]">
                Beta
              </span>
            </div>
            <p className="mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.04em] text-[var(--text-4)]">Application Automation</p>
          </div>
        </div>
      </div>

      <nav className="jf-nav">
        {SIDEBAR_NAV.map((section) => (
          <div key={section.section}>
            <div className="jf-nav-section-title jf-sidebar-collapsed-text">{section.section}</div>
            <div className="flex flex-col gap-px">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                const dynamicBadge =
                  item.href === "/jobs" ? jobsCount : item.href === "/interviews" ? interviewsCount : undefined;
                const staticBadge = "badge" in item ? item.badge : undefined;
                const badge = dynamicBadge !== undefined ? dynamicBadge : staticBadge;

                return (
                  <Link key={item.href} href={item.href} className={cn("jf-nav-item", isActive && "is-active")}>
                    <Icon size={16} />
                    <span className="jf-nav-label flex-1 truncate">{item.label}</span>
                    {typeof badge === "number" && badge > 0 ? (
                      <span className="jf-nav-badge jf-sidebar-collapsed-text">{badge}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="jf-sys-card jf-sidebar-collapsed-text">
        <div className="mb-2.5 flex items-center gap-2">
          <div className="grid h-[26px] w-[26px] flex-none place-items-center rounded-[7px] border border-[rgba(56,199,147,0.18)] bg-[var(--emerald-bg)] text-[var(--emerald)]">
            <LiveIcon size={13} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold leading-none text-[var(--text-1)]">System Online</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-3)]">17 modules · automation health</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-[rgba(56,199,147,0.22)] bg-[var(--emerald-bg)] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-[var(--emerald)]">
            <span className="jf-live-dot" />
            Live
          </span>
        </div>
        <div className="relative mt-0.5 h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)]">
          <div className="jf-progress-fill relative h-full w-[94%] rounded-full bg-gradient-to-r from-[#38C793] to-[#4FC2D8]" />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10.5px] text-[var(--text-3)]">
          <span>
            <b className="font-semibold text-[var(--text-1)]">94%</b> healthy
          </span>
          <span>Queue OK</span>
        </div>
      </div>
    </aside>
  );
}
