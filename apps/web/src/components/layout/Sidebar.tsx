"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { LiveIcon, SIDEBAR_NAV_PRIMARY, SIDEBAR_NAV_SECONDARY } from "@/components/icons";
import { BRAND } from "@/lib/brand";
import { useAutomationApi } from "@/hooks/api/useAutomationApi";
import { useInterviewsApi } from "@/hooks/api/useInterviewsApi";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { useTranslation } from "@/i18n/useTranslation";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { useJobPipelineSummary } from "@/context/JobPipelineSummaryContext";
import { normalizeAutomationModulesForUi } from "@/lib/utils/resource";
import { cn } from "@/lib/utils";
import type { Interview } from "@/types/interview";
import type { Job } from "@/types/job";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const jobsQ = useJobsApi({ fallbackToMock: false });
  const intQ = useInterviewsApi({ fallbackToMock: false });
  const automationApi = useAutomationApi({ fallbackToMock: false });
  const pipeline = useJobPipelineSummary();
  const jobsBadgeCount = pipeline.summary ? pipeline.totalActive : normalizeListResponse<Job>(jobsQ.list).length;
  const interviewsCount = normalizeListResponse<Interview>(intQ.list).length;

  const automationHealth = useMemo(() => {
    const modules = normalizeAutomationModulesForUi(normalizeListResponse<unknown>(automationApi.list));
    const total = modules.length;
    if (total === 0) {
      return { progressPct: 0, statusLine: t("sidebar.allGood"), hasIssues: false };
    }
    const healthy = modules.filter((m) => m.status === "Healthy" || m.status === "Ready").length;
    const failed = modules.filter((m) => m.status === "Failed").length;
    const needsSetup = modules.filter((m) => m.status === "Needs Setup").length;
    const progressPct = Math.round((healthy / total) * 100);
    if (failed > 0) {
      return {
        progressPct,
        statusLine: t("sidebar.automationsNeedAttention").replace("{{count}}", String(failed)),
        hasIssues: true,
      };
    }
    if (needsSetup > 0) {
      return {
        progressPct,
        statusLine: t("sidebar.automationsNeedSetup").replace("{{count}}", String(needsSetup)),
        hasIssues: true,
      };
    }
    return {
      progressPct,
      statusLine: t("sidebar.automationsHealthy").replace("{{healthy}}", String(healthy)).replace("{{total}}", String(total)),
      hasIssues: false,
    };
  }, [automationApi.list, t]);

  return (
    <aside className="jf-sidebar hidden md:flex">
      <div className="mb-3 border-b border-[var(--border-subtle)] pb-3.5">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex-none">
            <Image src={BRAND.iconPath} alt={BRAND.name} width={30} height={30} priority />
          </div>
          <div className="jf-sidebar-collapsed-text min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[13.5px] font-bold tracking-[-0.012em] text-[var(--text-1)]">{BRAND.name}</span>
              <span className="rounded-full border border-[var(--accent-ring)] bg-[var(--accent-bg)] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[var(--accent-hi)]">
                Beta
              </span>
            </div>
            <p className="mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.04em] text-[var(--text-4)]">
              {t("sidebar.assistantLine")}
            </p>
          </div>
        </div>
      </div>

      <nav className="jf-nav">
        {/* Primary navigation */}
        {SIDEBAR_NAV_PRIMARY.map((section) => (
          <div key={section.sectionKey}>
            <div className="flex flex-col gap-px">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                const badge = item.href === "/jobs" ? jobsBadgeCount : undefined;
                return (
                  <Link key={item.href} href={item.href} className={cn("jf-nav-item", isActive && "is-active")}>
                    <Icon size={16} />
                    <span className="jf-nav-label flex-1 truncate">{t(item.labelKey)}</span>
                    {typeof badge === "number" && badge > 0 ? (
                      <span className="jf-nav-badge jf-sidebar-collapsed-text">{badge}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Secondary navigation */}
        <div className="jf-sidebar-collapsed-text mt-3 border-t border-[var(--border-subtle)] pt-3">
          <div className="jf-nav-section-title mb-1 text-[10px] uppercase tracking-widest text-[var(--text-4)]">{t("navSection.more")}</div>
          <div className="flex flex-col gap-px">
            {SIDEBAR_NAV_SECONDARY.flatMap((s) => s.items).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const badge = item.href === "/interviews" ? interviewsCount : undefined;
              return (
                <Link key={item.href} href={item.href} className={cn("jf-nav-item", isActive && "is-active")}>
                  <Icon size={16} />
                  <span className="jf-nav-label flex-1 truncate">{t(item.labelKey)}</span>
                  {typeof badge === "number" && badge > 0 ? (
                    <span className="jf-nav-badge jf-sidebar-collapsed-text">{badge}</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="jf-sys-card jf-sidebar-collapsed-text">
        <Link href="/automation" className="mb-2.5 flex items-center gap-2 rounded-lg transition-colors hover:bg-[var(--surface-3)]">
          <div className={cn(
            "grid h-[26px] w-[26px] flex-none place-items-center rounded-[7px] border",
            automationHealth.hasIssues
              ? "border-[rgba(245,158,11,0.22)] bg-[var(--amber-bg)] text-amber-500"
              : "border-[rgba(56,199,147,0.18)] bg-[var(--emerald-bg)] text-[var(--emerald)]"
          )}>
            <LiveIcon size={13} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold leading-none text-[var(--text-1)]">{t("sidebar.assistantOnline")}</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-3)]">{automationHealth.statusLine}</p>
          </div>
          <span className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide",
            automationHealth.hasIssues
              ? "border-[rgba(245,158,11,0.22)] bg-[var(--amber-bg)] text-amber-600"
              : "border-[rgba(56,199,147,0.22)] bg-[var(--emerald-bg)] text-[var(--emerald)]"
          )}>
            <span className="jf-live-dot" />
            {t("sidebar.live")}
          </span>
        </Link>
        <div className="relative mt-0.5 h-1 overflow-hidden rounded-full bg-[var(--surface-4)]">
          <div
            className={cn(
              "relative h-full rounded-full bg-gradient-to-r",
              automationHealth.hasIssues ? "from-amber-500 to-orange-400" : "from-[#38C793] to-[#4FC2D8]"
            )}
            style={{ width: `${automationHealth.progressPct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10.5px] text-[var(--text-3)]">
          <span>{t("sidebar.active")}</span>
          <span>{automationHealth.hasIssues ? t("sidebar.queueOk") : t("sidebar.allGood")}</span>
        </div>
      </div>
    </aside>
  );
}
