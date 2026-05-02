"use client";

import { useState, useEffect, useCallback } from "react";
import type { AutomationLog } from "@/types/automation";

interface UseAutomationLogsState {
  logs:      AutomationLog[];
  total:     number;
  isLoading: boolean;
  error:     string | null;
}

export function useAutomationLogs(moduleId?: string, limit = 50) {
  const [state, setState] = useState<UseAutomationLogsState>({
    logs:      [],
    total:     0,
    isLoading: true,
    error:     null,
  });

  const fetchLogs = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (moduleId) params.set("moduleId", moduleId);

      const res  = await fetch(`/api/automation?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Failed to fetch logs");

      setState({ logs: json.data.items, total: json.data.total, isLoading: false, error: null });
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false, error: (err as Error).message }));
    }
  }, [moduleId, limit]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return { ...state, refresh: fetchLogs };
}
