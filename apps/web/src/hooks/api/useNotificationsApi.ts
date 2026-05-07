"use client";

import * as api from "@/lib/api/notifications.api";
import { useCallback } from "react";
import { useApiQuery } from "./useApiQuery";

export function useNotificationsApi(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;

  const listQuery = useApiQuery(() => api.listNotifications({ limit: 40 }), {
    fallbackToMock: false,
    enabled,
  });
  const countQuery = useApiQuery(() => api.getUnreadNotificationCount(), {
    fallbackToMock: false,
    enabled,
  });

  const refetch = useCallback(async () => {
    await Promise.all([listQuery.refetch(), countQuery.refetch()]);
  }, [listQuery, countQuery]);

  return { listQuery, countQuery, refetch };
}
