"use client";

import { useState, useEffect, useCallback } from "react";
import type { Application } from "@/types/application";

interface UseApplicationsState {
  applications: Application[];
  total:        number;
  isLoading:    boolean;
  error:        string | null;
}

export function useApplications(jobId?: string) {
  const [state, setState] = useState<UseApplicationsState>({
    applications: [],
    total:        0,
    isLoading:    true,
    error:        null,
  });

  const fetchApplications = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams();
      if (jobId) params.set("jobId", jobId);

      const res  = await fetch(`/api/applications?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Failed to fetch applications");

      setState({
        applications: json.data.items,
        total:        json.data.total,
        isLoading:    false,
        error:        null,
      });
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false, error: (err as Error).message }));
    }
  }, [jobId]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  return { ...state, refresh: fetchApplications };
}
