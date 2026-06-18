"use client";

import Link from "next/link";
import { useEffect } from "react";
import { NotificationIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, useDropdownMenuContext } from "@/components/ui/dropdown-menu";
import { useNotificationsApi } from "@/hooks/api/useNotificationsApi";
import type { InAppNotificationDto } from "@/lib/api/notifications.api";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/api/notifications.api";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";

function resolveActionHref(n: InAppNotificationDto): string {
  if (n.actionUrl?.startsWith("/")) return n.actionUrl;
  if (n.relatedRecordType === "Job" && n.relatedRecordId) return `/jobs/${n.relatedRecordId}`;
  if (n.moduleKey === "pdf-export" || n.relatedRecordType === "Report") return "/reports";
  return "/automation";
}

export function NotificationBell() {
  const { listQuery, countQuery, refetch } = useNotificationsApi();
  const count = typeof countQuery.data?.count === "number" ? countQuery.data.count : 0;

  return (
    <DropdownMenu>
      <NotificationBellMenu count={count} listQuery={listQuery} refetch={refetch} />
    </DropdownMenu>
  );
}

function NotificationListContent({
  items,
  loading,
  onMarkOne,
  onMarkAll,
  onNavigate,
}: {
  items: InAppNotificationDto[];
  loading: boolean;
  onMarkOne: (id: string) => void | Promise<void>;
  onMarkAll: () => void | Promise<void>;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();

  function actionLabelFor(n: InAppNotificationDto): string {
    if (n.moduleKey === "report-delivery") return t("notifications.openReports");
    if (n.moduleKey === "pdf-export") return t("notifications.openReports");
    if (n.relatedRecordType === "Job") return t("notifications.openJob");
    return t("notifications.viewLogs");
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-default)] px-3 py-2.5">
        <span className="text-[13px] font-semibold text-[var(--text-1)]">{t("notifications.title")}</span>
        <Button type="button" variant="ghost" size="sm" className="min-h-[36px] text-xs" onClick={() => void onMarkAll()}>
          {t("notifications.markAllRead")}
        </Button>
      </div>
      {loading && !items.length ? (
        <div className="px-3 py-6 text-center text-sm text-[var(--text-3)]">{t("notifications.loading")}</div>
      ) : items.length === 0 ? (
        <div className="px-3 py-6 text-center text-sm text-[var(--text-3)]">{t("notifications.none")}</div>
      ) : (
        <ul className="divide-y divide-[var(--border-subtle)]">
          {items.map((n) => (
            <li key={n.id} className={cn("space-y-1.5 px-3 py-3", !n.read && "bg-[rgba(99,124,255,0.06)]")}>
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 break-words text-[13px] font-semibold leading-snug text-[var(--text-1)]">
                  {n.title}
                </p>
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-[var(--text-4)]">{n.severity}</span>
              </div>
              <p className="break-words text-xs leading-relaxed text-[var(--text-3)]">{n.message}</p>
              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <span className="break-all text-[11px] text-[var(--text-5)]">
                  {n.moduleKey ? `${n.moduleKey} · ` : ""}
                  {n.createdAt ? formatDate(n.createdAt, "MMM d, HH:mm") : ""}
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={resolveActionHref(n)}
                    className="min-h-[36px] text-[12px] font-medium leading-9 text-[var(--accent-hi)] hover:underline"
                    onClick={onNavigate}
                  >
                    {actionLabelFor(n)}
                  </Link>
                  {!n.read ? (
                    <button
                      type="button"
                      className="min-h-[36px] text-[12px] font-medium leading-9 text-[var(--text-2)] hover:underline"
                      onClick={() => void onMarkOne(n.id)}
                    >
                      {t("notifications.markRead")}
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function NotificationBellMenu({
  count,
  listQuery,
  refetch,
}: {
  count: number;
  listQuery: ReturnType<typeof useNotificationsApi>["listQuery"];
  refetch: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const dropdown = useDropdownMenuContext();
  const open = dropdown?.open ?? false;
  const items = Array.isArray(listQuery.data) ? listQuery.data : [];

  const handleMarkOne = async (id: string) => {
    await markNotificationRead(id);
    await refetch();
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    await refetch();
  };

  useEffect(() => {
    if (!open || !isMobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isMobile]);

  const panelContent = (
    <NotificationListContent
      items={items}
      loading={listQuery.loading}
      onMarkOne={handleMarkOne}
      onMarkAll={handleMarkAll}
      onNavigate={() => dropdown?.close()}
    />
  );

  return (
    <>
      <DropdownMenuTrigger>
        <button
          type="button"
          className="relative grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-[var(--r-sm)] border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-2)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)] md:h-[34px] md:w-[34px] md:min-h-[34px] md:min-w-[34px]"
          aria-label={t("notifications.title")}
          onClick={() => void refetch()}
        >
          <NotificationIcon size={15} />
          {count > 0 ? (
            <span className="absolute right-1 top-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[var(--rose)] px-0.5 text-[9px] font-bold text-white shadow-[0_0_0_2px_var(--surface-2)]">
              {count > 99 ? "99+" : count}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      {isMobile && open ? (
        <div className="fixed inset-0 z-[70] md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => dropdown?.close()} aria-hidden />
          <div
            className="absolute inset-x-3 max-h-[min(75dvh,520px)] overflow-hidden overflow-y-auto rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] shadow-[var(--shadow-pop)]"
            style={{ top: "calc(var(--mobile-chrome-top, 52px) + 0.5rem)" }}
            role="menu"
          >
            {panelContent}
          </div>
        </div>
      ) : (
        <DropdownMenuContent className="w-[min(380px,calc(100vw-1.5rem))] max-h-[min(70vh,440px)] overflow-hidden overflow-y-auto p-0">
          {panelContent}
        </DropdownMenuContent>
      )}
    </>
  );
}
