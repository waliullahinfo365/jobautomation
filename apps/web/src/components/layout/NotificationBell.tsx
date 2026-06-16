"use client";

import Link from "next/link";
import { NotificationIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, useDropdownMenuContext } from "@/components/ui/dropdown-menu";
import { useNotificationsApi } from "@/hooks/api/useNotificationsApi";
import type { InAppNotificationDto } from "@/lib/api/notifications.api";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/api/notifications.api";
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
  const dropdown = useDropdownMenuContext();
  const items = Array.isArray(listQuery.data) ? listQuery.data : [];

  function actionLabelFor(n: InAppNotificationDto): string {
    if (n.moduleKey === "report-delivery") return t("notifications.openReports");
    if (n.moduleKey === "pdf-export") return t("notifications.openReports");
    if (n.relatedRecordType === "Job") return t("notifications.openJob");
    return t("notifications.viewLogs");
  }

  const handleMarkOne = async (id: string) => {
    await markNotificationRead(id);
    await refetch();
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    await refetch();
  };

  return (
    <>
      <DropdownMenuTrigger>
        <button
          type="button"
          className="relative grid h-[34px] w-[34px] place-items-center rounded-[var(--r-sm)] border border-[var(--border-default)] bg-[var(--surface-2)] text-[var(--text-2)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
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
      <DropdownMenuContent className="w-[380px] max-h-[min(70vh,440px)] overflow-hidden overflow-y-auto p-0">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border-default)] px-3 py-2">
          <span className="text-[13px] font-semibold text-[var(--text-1)]">{t("notifications.title")}</span>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => void handleMarkAll()}>
            {t("notifications.markAllRead")}
          </Button>
        </div>
        {listQuery.loading && !items.length ? (
          <div className="px-3 py-6 text-center text-sm text-[var(--text-3)]">{t("notifications.loading")}</div>
        ) : items.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-[var(--text-3)]">{t("notifications.none")}</div>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn("space-y-1 px-3 py-2.5", !n.read && "bg-[rgba(99,124,255,0.06)]")}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-semibold leading-snug text-[var(--text-1)]">{n.title}</p>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-[var(--text-4)]">{n.severity}</span>
                </div>
                <p className="text-xs leading-relaxed text-[var(--text-3)]">{n.message}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-[var(--text-5)]">
                    {n.moduleKey ? `${n.moduleKey} · ` : ""}
                    {n.createdAt ? formatDate(n.createdAt, "MMM d, HH:mm") : ""}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={resolveActionHref(n)}
                      className="text-[11px] font-medium text-[var(--accent-hi)] hover:underline"
                      onClick={() => dropdown?.close()}
                    >
                      {actionLabelFor(n)}
                    </Link>
                    {!n.read ? (
                      <button
                        type="button"
                        className="text-[11px] font-medium text-[var(--text-2)] hover:underline"
                        onClick={() => void handleMarkOne(n.id)}
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
      </DropdownMenuContent>
    </>
  );
}
