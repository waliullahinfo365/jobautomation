"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApplicationsIcon } from "@/components/icons";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApplicationStatsCards } from "./ApplicationStatsCards";
import { ApplicationFilters, type ApplicationFilterState } from "./ApplicationFilters";
import { ApplicationsTable } from "./ApplicationsTable";
import { ApplicationDetailPanel } from "./ApplicationDetailPanel";
import type { Application } from "@/types/application";
import { useApplicationsApi } from "@/hooks/api/useApplicationsApi";
import { useIntegrationsApi } from "@/hooks/api/useIntegrationsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { getResourceId, normalizeApplicationsForUi } from "@/lib/utils/resource";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";
import { AnimatePresence, motion } from "framer-motion";

const initialFilters: ApplicationFilterState = {
  query: "",
  applicationStatus: "All",
  responseStatus: "All",
  followUpStatus: "All",
  dateRange: "All Dates",
};

function addDaysLocalDatetime(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function filterApplications(applications: Application[], filters: ApplicationFilterState) {
  return applications.filter((app) => {
    const matchesQuery =
      !filters.query ||
      `${app.company} ${app.position} ${app.contactEmail}`.toLowerCase().includes(filters.query.toLowerCase());
    const matchesAppStatus =
      filters.applicationStatus === "All" ? true : app.applicationStatus === filters.applicationStatus;
    const matchesResponse =
      filters.responseStatus === "All" ? true : app.responseStatus === filters.responseStatus;
    const matchesFollowUp =
      filters.followUpStatus === "All" ? true : app.followUpStatus === filters.followUpStatus;

    return matchesQuery && matchesAppStatus && matchesResponse && matchesFollowUp;
  });
}

export function ApplicationsPageClient() {
  const applicationsApi = useApplicationsApi({ fallbackToMock: true });
  const integrationsApi = useIntegrationsApi({ fallbackToMock: false });

  const [filters, setFilters] = useState<ApplicationFilterState>(initialFilters);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [fallbackEdits, setFallbackEdits] = useState<Record<string, Partial<Application>>>({});
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [scheduleLocal, setScheduleLocal] = useState(addDaysLocalDatetime(5));
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const baseApplications = useMemo(() => {
    const raw = normalizeListResponse<unknown>(applicationsApi.data);
    const normalized = normalizeApplicationsForUi(raw);
    return normalized.length > 0 ? normalized : [];
  }, [applicationsApi.data]);

  useEffect(() => {
    if (!applicationsApi.isUsingFallback) setFallbackEdits({});
  }, [applicationsApi.isUsingFallback]);

  const applications = useMemo(() => {
    if (!applicationsApi.isUsingFallback || Object.keys(fallbackEdits).length === 0) return baseApplications;
    return baseApplications.map((app) => {
      const id = getResourceId(app);
      const ed = fallbackEdits[id];
      return ed ? ({ ...app, ...ed } as Application) : app;
    });
  }, [baseApplications, applicationsApi.isUsingFallback, fallbackEdits]);

  useEffect(() => {
    if (!selectedApplication) return;
    const sid = getResourceId(selectedApplication);
    const fresh = applications.find((a) => getResourceId(a) === sid);
    if (!fresh) return;
    if (
      fresh.updatedAt !== selectedApplication.updatedAt ||
      fresh.followUpStatus !== selectedApplication.followUpStatus ||
      fresh.applicationStatus !== selectedApplication.applicationStatus
    ) {
      setSelectedApplication(fresh);
    }
  }, [applications, selectedApplication]);

  const filteredApplications = useMemo(() => filterApplications(applications, filters), [applications, filters]);

  const stats = useMemo(() => {
    return {
      totalApplications: applications.length,
      awaitingResponse: applications.filter((a) => a.responseStatus === "No Response").length,
      repliesReceived: applications.filter((a) => a.responseStatus !== "No Response").length,
      interviewsScheduled: applications.filter((a) => a.applicationStatus === "Interview").length,
      followUpsDue: applications.filter((a) => a.followUpStatus === "Due Today" || a.followUpStatus === "Overdue").length,
      offers: applications.filter((a) => a.applicationStatus === "Offer").length,
    };
  }, [applications]);

  const runWithFallback = useCallback(
    async (opts: {
      apiFn: () => Promise<unknown>;
      fallbackPatch: (id: string) => Partial<Application>;
      successMessage: string;
      id: string;
    }) => {
      const { apiFn, fallbackPatch, successMessage, id } = opts;
      if (applicationsApi.isUsingFallback) {
        setFallbackEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...fallbackPatch(id) } }));
        showInfo("API offline, updated demo data locally.");
        showSuccess(successMessage);
        return;
      }
      try {
        await apiFn();
        showSuccess(successMessage);
        await applicationsApi.refetch();
      } catch {
        showError("Action failed. Please try again.");
      }
    },
    [applicationsApi]
  );

  const handleView = (application: Application) => {
    setSelectedApplication(application);
    setPanelOpen(true);
  };

  const patchFallbackById = useCallback((id: string, patch: Partial<Application>) => {
    setFallbackEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const handleMarkFollowUpSent = async (id: string) => {
    await runWithFallback({
      id,
      apiFn: () => applicationsApi.markFollowUpSent(id),
      fallbackPatch: () => ({
        followUpStatus: "Sent",
        reminderStatus: "Sent",
        reminderSentDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      successMessage: "Follow-up marked as sent.",
    });
  };

  const handleMarkApplied = async (app: Application) => {
    const id = getResourceId(app);
    setPendingAction("markApplied");
    try {
      await runWithFallback({
        id,
        apiFn: () => applicationsApi.markApplied({ id, payload: { appliedAt: new Date().toISOString() } }),
        fallbackPatch: () => ({
          applicationStatus: "Applied",
          status: "Applied",
          dateApplied: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        successMessage: "Application marked as applied.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const openScheduleDialog = () => {
    setScheduleLocal(addDaysLocalDatetime(5));
    setScheduleMessage("");
    setScheduleOpen(true);
  };

  const confirmScheduleFollowUp = async () => {
    if (!selectedApplication) return;
    const id = getResourceId(selectedApplication);
    const scheduleDateIso = new Date(scheduleLocal).toISOString();
    setScheduleOpen(false);
    setPendingAction("schedule");
    try {
      await runWithFallback({
        id,
        apiFn: () =>
          applicationsApi.scheduleFollowUp({
            id,
            payload: {
              followUpDate: scheduleDateIso,
              ...(scheduleMessage.trim() ? { message: scheduleMessage.trim() } : {}),
            },
          }),
        fallbackPatch: () => ({
          followUpStatus: "Scheduled",
          followUpDate: scheduleDateIso,
          followUpMessagePreview: scheduleMessage.trim() || selectedApplication.followUpMessagePreview,
          updatedAt: new Date().toISOString(),
        }),
        successMessage: "Follow-up scheduled.",
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleProcessDueFollowUps = async () => {
    setPendingAction("processDue");
    try {
      if (applicationsApi.isUsingFallback) {
        showInfo("API offline, updated demo data locally.");
        for (const app of applications) {
          if (app.followUpStatus === "Due Today" || app.followUpStatus === "Overdue") {
            patchFallbackById(getResourceId(app), {
              followUpStatus: "Sent",
              reminderStatus: "Sent",
              reminderSentDate: new Date().toISOString(),
            });
          }
        }
        showSuccess("Processed due follow-ups (demo).");
        return;
      }
      try {
        const result = (await applicationsApi.processDueFollowUps({})) as {
          processed?: number;
          sent?: number;
          skipped?: number;
          failed?: number;
        };
        const msg = `Processed ${result.processed ?? 0}: sent ${result.sent ?? 0}, skipped ${result.skipped ?? 0}${
          result.failed ? `, failed ${result.failed}` : ""
        }.`;
        showSuccess(msg);
        await applicationsApi.refetch();
      } catch {
        showError("Could not process due follow-ups.");
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleSimulateReply = async (app: Application) => {
    const id = getResourceId(app);
    setPendingAction("replyTest");
    try {
      const payload = {
        providerMessageId: `demo-reply-${Date.now()}`,
        providerThreadId: app.providerThreadId || `demo-thread-${id}`,
        from: app.contactEmail || "recruiter@example.com",
        subject: `Interview availability for ${app.position}`,
        bodyText: "Thanks for applying. Are you available for an interview next week?",
        receivedAt: new Date().toISOString(),
      };
      if (applicationsApi.isUsingFallback) {
        patchFallbackById(id, {
          responseStatus: "Positive Reply",
          responseDetected: true,
          lastReplySnippet: payload.bodyText.slice(0, 80),
          updatedAt: new Date().toISOString(),
        });
        showInfo("API offline, updated demo data locally.");
        showSuccess("Simulated reply applied to demo data.");
        return;
      }
      try {
        await integrationsApi.replyTest(payload);
        showSuccess("Reply test processed.");
        await applicationsApi.refetch();
      } catch {
        showError("Reply test failed.");
      }
    } finally {
      setPendingAction(null);
    }
  };

  const isInitialLoading = applicationsApi.loading && applicationsApi.data === undefined;

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={ApplicationsIcon}
          eyebrow="Application Workflow"
          title="Applications"
          description="Monitor submitted applications, replies, follow-ups, and interview progress."
          actions={<Button type="button">Log Application</Button>}
        />
        <LoadingState title="Loading applications..." description="Fetching application pipeline data." />
      </div>
    );
  }

  const emptyAll = applications.length === 0;
  const emptyFiltered = !emptyAll && filteredApplications.length === 0;

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          icon={ApplicationsIcon}
          eyebrow="Application Workflow"
          title="Applications"
          description="Monitor submitted applications, replies, follow-ups, and interview progress."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!!pendingAction}
                onClick={() => void handleProcessDueFollowUps()}
              >
                Process Due Follow-Ups
              </Button>
              <Button type="button">Log Application</Button>
            </div>
          }
        />

        <ApplicationStatsCards stats={stats} />

        <ApplicationFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(initialFilters)}
          aside={applicationsApi.isUsingFallback ? <ApiStatusIndicator usingMock /> : null}
        />

        {emptyAll ? (
          <EmptyState
            title="No applications yet"
            description="When you track applications, they will appear here with reply and follow-up status."
          />
        ) : emptyFiltered ? (
          <EmptyState
            title="No matching applications"
            description="Try adjusting filters or search."
            actionLabel="Clear filters"
            onAction={() => setFilters(initialFilters)}
          />
        ) : (
          <ApplicationsTable
            applications={filteredApplications}
            onView={handleView}
            onMarkFollowUpSent={(id) => void handleMarkFollowUpSent(id)}
          />
        )}
      </div>

      <ApplicationDetailPanel
        application={selectedApplication}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onMarkApplied={selectedApplication ? () => void handleMarkApplied(selectedApplication) : undefined}
        onScheduleFollowUp={openScheduleDialog}
        onMarkFollowUpSent={
          selectedApplication ? () => void handleMarkFollowUpSent(getResourceId(selectedApplication)) : undefined
        }
        onSimulateReply={selectedApplication ? () => void handleSimulateReply(selectedApplication) : undefined}
        pendingAction={pendingAction}
      />

      <AnimatePresence>
        {scheduleOpen ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setScheduleOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-foreground">Schedule follow-up</h3>
              <p className="mt-1 text-sm text-muted-foreground">Pick a date for the next touchpoint.</p>
              <div className="mt-4 space-y-3">
                <label className="block text-xs font-medium text-muted-foreground">
                  Follow-up date
                  <Input
                    className="mt-1"
                    type="datetime-local"
                    value={scheduleLocal}
                    onChange={(e) => setScheduleLocal(e.target.value)}
                  />
                </label>
                <label className="block text-xs font-medium text-muted-foreground">
                  Message (optional)
                  <Input
                    className="mt-1"
                    value={scheduleMessage}
                    onChange={(e) => setScheduleMessage(e.target.value)}
                    placeholder="Short reminder note"
                  />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => void confirmScheduleFollowUp()}>
                  Schedule
                </Button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
