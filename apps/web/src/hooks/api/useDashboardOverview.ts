"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as applicationsApi from "@/lib/api/applications.api";
import * as automationApi from "@/lib/api/automation.api";
import * as jobsApi from "@/lib/api/jobs.api";
import { getMockFallback, shouldUseMockFallback } from "@/lib/api/mockFallback";

type Slice<T> = {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  isUsingFallback: boolean;
};

type Options = { fallbackToMock?: boolean; params?: Record<string, unknown> };

type CombinedState = {
  jobs: Slice<unknown>;
  applications: Slice<unknown>;
  modules: Slice<unknown>;
  logs: Slice<unknown>;
};

function emptySlice(): Slice<unknown> {
  return { data: undefined, loading: true, error: null, isUsingFallback: false };
}

// Module-level initial state — same shape on every mount, avoids needless re-renders.
const INITIAL_STATE: CombinedState = {
  jobs: emptySlice(),
  applications: emptySlice(),
  modules: emptySlice(),
  logs: emptySlice(),
};

async function loadWithFallback<T>(
  fetcher: () => Promise<T>,
  opts: { fallbackToMock?: boolean; mockResourceName?: string }
): Promise<Slice<T>> {
  try {
    const data = await fetcher();
    return { data, loading: false, error: null, isUsingFallback: false };
  } catch (err) {
    const allowed = opts.fallbackToMock && shouldUseMockFallback(err);
    if (allowed && opts.mockResourceName) {
      return { data: getMockFallback(opts.mockResourceName) as T, loading: false, error: null, isUsingFallback: true };
    }
    return { data: undefined, loading: false, error: err as Error, isUsingFallback: false };
  }
}

async function fetchAll(o: Options | undefined): Promise<CombinedState> {
  const p = o?.params;
  const fb = o?.fallbackToMock;
  const [jobs, applications, modules, logs] = await Promise.all([
    loadWithFallback(() => jobsApi.listJobs(p), { fallbackToMock: fb, mockResourceName: "jobs" }),
    loadWithFallback(() => applicationsApi.listApplications(p), { fallbackToMock: fb, mockResourceName: "applications" }),
    loadWithFallback(() => automationApi.listAutomationModules(), { fallbackToMock: fb, mockResourceName: "automationModules" }),
    loadWithFallback(() => automationApi.listAutomationLogs(p), { fallbackToMock: fb, mockResourceName: "automationLogs" }),
  ]);
  return { jobs, applications, modules, logs };
}

/** Survives Fast Refresh / duplicate chunks; also holds snapshot cooldown state. */
type DashboardOverviewGlobal = {
  inFlight: Promise<CombinedState> | null;
  mountWave: number;
  lastCompletedAt: number;
  lastOptsKey: string;
  lastSnapshot: CombinedState | null;
};

const GO = globalThis as unknown as { __JOBFLOW_DASHBOARD_OVERVIEW__?: DashboardOverviewGlobal };

const SNAPSHOT_REUSE_MS =
  typeof process !== "undefined" && process.env.NODE_ENV !== "production" ? 30_000 : 10_000;

function dashOverviewGlobal(): DashboardOverviewGlobal {
  if (!GO.__JOBFLOW_DASHBOARD_OVERVIEW__) {
    GO.__JOBFLOW_DASHBOARD_OVERVIEW__ = {
      inFlight: null,
      mountWave: 0,
      lastCompletedAt: 0,
      lastOptsKey: "",
      lastSnapshot: null,
    };
  }
  return GO.__JOBFLOW_DASHBOARD_OVERVIEW__;
}

function optsFingerprint(o: Options | undefined): string {
  try {
    return JSON.stringify({ fb: o?.fallbackToMock ?? false, params: o?.params ?? null });
  } catch {
    return `${o?.fallbackToMock}`;
  }
}

/**
 * Fetches all dashboard slices in a single coordinated request.
 *
 * Key invariants:
 *  - `globalThis` coordinator dedupes across component remounts and Fast Refresh.
 *  - `mountWave` prevents stale `setState` after remount.
 *  - Recent snapshot reuse skips network when the tree remounts in a tight loop (dev/HMR).
 */
export function useDashboardOverview(options?: Options) {
  const [state, setState] = useState<CombinedState>(INITIAL_STATE);

  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const g = dashOverviewGlobal();
    const wave = ++g.mountWave;
    const key = optsFingerprint(optsRef.current);

    if (
      g.lastSnapshot &&
      g.lastOptsKey === key &&
      Date.now() - g.lastCompletedAt < SNAPSHOT_REUSE_MS
    ) {
      setState(g.lastSnapshot);
      return;
    }

    void (async () => {
      let p = g.inFlight;
      if (!p) {
        p = fetchAll(optsRef.current).finally(() => {
          if (g.inFlight === p) g.inFlight = null;
        });
        g.inFlight = p;
      }
      const result = await p;
      if (wave !== g.mountWave) return;
      g.lastSnapshot = result;
      g.lastOptsKey = key;
      g.lastCompletedAt = Date.now();
      setState(result);
    })();
  }, []);

  const refetchAll = useCallback(async () => {
    const g = dashOverviewGlobal();
    g.inFlight = null;
    g.lastSnapshot = null;
    g.lastCompletedAt = 0;
    const p = fetchAll(optsRef.current).finally(() => {
      if (g.inFlight === p) g.inFlight = null;
    });
    g.inFlight = p;
    const result = await p;
    const key = optsFingerprint(optsRef.current);
    g.lastSnapshot = result;
    g.lastOptsKey = key;
    g.lastCompletedAt = Date.now();
    setState(result);
  }, []);

  return {
    jobsQuery: state.jobs,
    applicationsQuery: state.applications,
    automationQuery: {
      data: state.modules.data,
      loading: state.modules.loading,
      error: state.modules.error,
      isUsingFallback: state.modules.isUsingFallback,
      logs: state.logs,
    },
    refetchAll,
  };
}
