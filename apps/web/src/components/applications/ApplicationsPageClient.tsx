"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApplicationsIcon } from "@/components/icons";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApplicationStatsCards } from "./ApplicationStatsCards";
import { ApplicationFilters, type ApplicationFilterState } from "./ApplicationFilters";
import { ApplicationsTable } from "./ApplicationsTable";
import { ApplicationCard } from "./ApplicationCard";
import { ApplicationDetailPanel } from "./ApplicationDetailPanel";
import { LogApplicationModal } from "./LogApplicationModal";
import type { Application } from "@/types/application";
import { useApplicationsApi } from "@/hooks/api/useApplicationsApi";
import { ApiError } from "@/lib/api/client";
import { buildCreateApplicationPayload, type CreateApplicationFormPayload } from "@/lib/api/applications.api";
import { shouldUseMockFallback } from "@/lib/api/mockFallback";
import { useIntegrationsApi } from "@/hooks/api/useIntegrationsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { getResourceId, normalizeApplicationsForUi } from "@/lib/utils/resource";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";
import { useTranslation } from "@/i18n/useTranslation";
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

function buildLocalDemoApplication(input: CreateApplicationFormPayload): Application {
  const id = `local-app-${Date.now()}`;
  const now = new Date().toISOString();
  const appliedIso = input.appliedDate
    ? /^\d{4}-\d{2}-\d{2}$/.test(input.appliedDate)
      ? new Date(`${input.appliedDate}T12:00:00.000Z`).toISOString()
      : input.appliedDate
    : now;
  return normalizeApplicationsForUi([
    {
      _id: id,
      id,
      jobId: input.jobId ?? "",
      company: input.company,
      position: input.position,
      source: input.source,
      applicationStatus: input.applicationStatus,
      status: input.applicationStatus,
      responseStatus: input.responseStatus,
      followUpStatus: input.followUpStatus,
      contactEmail: input.contactEmail ?? "",
      jobUrl: input.jobUrl ?? "",
      notes: input.notes,
      dateApplied: appliedIso,
      dateFound: now,
      timeline: [],
      automationLogs: [],
      automationHealth: "Healthy",
      responseDetected: false,
      aiClassification: "",
      createdAt: now,
      updatedAt: now,
      reminderStatus: input.followUpStatus,
    },
  ])[0]!;
}

function filterApplications(applications: Application[], filters: ApplicationFilterState) {
  const now = Date.now();
  const cutoff =
    filters.dateRange === "Last 7 Days"
      ? now - 7 * 24 * 60 * 60 * 1000
      : filters.dateRange === "Last 30 Days"
        ? now - 30 * 24 * 60 * 60 * 1000
        : null;

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
    const matchesDate =
      !cutoff || (app.dateFound ? new Date(app.dateFound).getTime() >= cutoff : true);

    return matchesQuery && matchesAppStatus && matchesResponse && matchesFollowUp && matchesDate;
  });
}

type AppTab = "applied" | "waiting" | "interview" | "closed" | "all";

const APP_TAB_STATUSES: Record<AppTab, string[] | null> = {
  applied: ["Applied"],
  waiting: ["Follow-Up Due"],
  interview: ["Interview"],
  closed: ["Offer", "Rejected", "Archived"],
  all: null,
};

export function ApplicationsPageClient() {
  const { t } = useTranslation();
  const applicationsApi = useApplicationsApi({ fallbackToMock: false });
  const integrationsApi = useIntegrationsApi({ fallbackToMock: false });

  const [activeTab, setActiveTab] = useState<AppTab>("all");
  const [filters, setFilters] = useState<ApplicationFilterState>(initialFilters);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [fallbackEdits, setFallbackEdits] = useState<Record<string, Partial<Application>>>({});
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [scheduleLocal, setScheduleLocal] = useState(addDaysLocalDatetime(5));
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isLogApplicationOpen, setIsLogApplicationOpen] = useState(false);
  const [localApplicationsOverlay, setLocalApplicationsOverlay] = useState<Application[]>([]);

  const mergedFromApi = useMemo(() => {
    const raw = normalizeListResponse<unknown>(applicationsApi.data);
    const normalized = normalizeApplicationsForUi(raw);
    return normalized.length > 0 ? normalized : [];
  }, [applicationsApi.data]);

  useEffect(() => {
    if (!applicationsApi.isUsingFallback) {
      setFallbackEdits({});
      setLocalApplicationsOverlay([]);
    }
  }, [applicationsApi.isUsingFallback]);

  const mergedList = useMemo(() => {
    if (!localApplicationsOverlay.length) return mergedFromApi;
    const seen = new Set(mergedFromApi.map(getResourceId));
    const extra = localApplicationsOverlay.filter((a) => !seen.has(getResourceId(a)));
    return [...extra, ...mergedFromApi];
  }, [mergedFromApi, localApplicationsOverlay]);

  const applications = useMemo(() => {
    if (!applicationsApi.isUsingFallback || Object.keys(fallbackEdits).length === 0) return mergedList;
    return mergedList.map((app) => {
      const id = getResourceId(app);
      const ed = fallbackEdits[id];
      return ed ? ({ ...app, ...ed } as Application) : app;
    });
  }, [mergedList, applicationsApi.isUsingFallback, fallbackEdits]);

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

  const tabFilteredApplications = useMemo(() => {
    const allowed = APP_TAB_STATUSES[activeTab];
    if (!allowed) return applications;
    return applications.filter((a) => allowed.includes(a.applicationStatus));
  }, [applications, activeTab]);

  const filteredApplications = useMemo(() => filterApplications(tabFilteredApplications, filters), [tabFilteredApplications, filters]);

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
        showInfo(t("applications.toast.offlineDemo"));
        showSuccess(successMessage);
        return;
      }
      try {
        await apiFn();
        showSuccess(successMessage);
        await applicationsApi.refetch();
      } catch {
        showError(t("applications.toast.actionFailed"));
      }
    },
    [applicationsApi, t]
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
      successMessage: t("applications.toast.followUpSent"),
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
        successMessage: t("applications.toast.markedApplied"),
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
        successMessage: t("applications.toast.followUpScheduled"),
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleProcessDueFollowUps = async () => {
    setPendingAction("processDue");
    try {
      if (applicationsApi.isUsingFallback) {
        showInfo(t("applications.toast.offlineDemo"));
        for (const app of applications) {
          if (app.followUpStatus === "Due Today" || app.followUpStatus === "Overdue") {
            patchFallbackById(getResourceId(app), {
              followUpStatus: "Sent",
              reminderStatus: "Sent",
              reminderSentDate: new Date().toISOString(),
            });
          }
        }
        showSuccess(t("applications.toast.processedDueDemo"));
        return;
      }
      try {
        const result = (await applicationsApi.processDueFollowUps({})) as {
          processed?: number;
          sent?: number;
          skipped?: number;
          failed?: number;
        };
        const total = (result.processed ?? 0) || (result.sent ?? 0) + (result.skipped ?? 0) + (result.failed ?? 0);
        showSuccess(`${total} ${t("applications.toast.followUpsProcessed")}`);
        await applicationsApi.refetch();
      } catch {
        showError(t("applications.toast.couldNotProcess"));
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleLogApplication = useCallback(
    async (form: CreateApplicationFormPayload) => {
      const payload = buildCreateApplicationPayload(form);
      try {
        await applicationsApi.createApplication(payload);
        showSuccess(t("applications.toast.applicationLogged"));
        setIsLogApplicationOpen(false);
        await applicationsApi.refetch();
      } catch (e) {
        if (shouldUseMockFallback(e)) {
          setLocalApplicationsOverlay((prev) => [buildLocalDemoApplication(form), ...prev]);
          showInfo(t("applications.toast.offlineAppAdded"));
          setIsLogApplicationOpen(false);
        } else {
          showError(e instanceof ApiError ? e.message : t("applications.toast.failedLogApp"));
        }
      }
    },
    [applicationsApi, t]
  );

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
        showInfo(t("applications.toast.offlineDemo"));
        showSuccess(t("applications.toast.replySimulated"));
        return;
      }
      try {
        await integrationsApi.replyTest(payload);
        showSuccess(t("applications.toast.replyTestProcessed"));
        await applicationsApi.refetch();
      } catch {
        showError(t("applications.toast.actionFailed"));
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
          eyebrow={t("applications.eyebrow")}
          title={t("applications.title")}
          description={t("applications.description")}
          actions={
            <Button type="button" onClick={() => setIsLogApplicationOpen(true)}>
              {t("applications.logApplication")}
            </Button>
          }
        />
        <LoadingState title={t("loading.applications")} description={t("loading.applicationData")} />
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
          eyebrow={t("applications.eyebrow")}
          title={t("applications.title")}
          description={t("applications.description")}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!!pendingAction}
                onClick={() => void handleProcessDueFollowUps()}
              >
                {t("applications.processDueFollowups")}
              </Button>
              <Button type="button" onClick={() => setIsLogApplicationOpen(true)}>
                {t("applications.logApplication")}
              </Button>
            </div>
          }
        />

        <ApplicationStatsCards stats={stats} />

        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-1">
          {(["all", "applied", "waiting", "interview", "closed"] as AppTab[]).map((tab) => {
            const labels: Record<AppTab, string> = { all: "All", applied: "Applied", waiting: "Follow-up", interview: "Interview", closed: "Closed" };
            const counts: Record<AppTab, number> = {
              all: applications.length,
              applied: applications.filter((a) => a.applicationStatus === "Applied").length,
              waiting: applications.filter((a) => a.applicationStatus === "Follow-Up Due").length,
              interview: applications.filter((a) => a.applicationStatus === "Interview").length,
              closed: applications.filter((a) => ["Offer","Rejected","Archived"].includes(a.applicationStatus)).length,
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[var(--surface-1)] text-[var(--text-1)] shadow-sm"
                    : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                }`}
              >
                {labels[tab]}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${activeTab === tab ? "bg-[var(--accent-bg)] text-[var(--accent-hi)]" : "bg-[var(--surface-3)] text-[var(--text-4)]"}`}>
                  {counts[tab]}
                </span>
              </button>
            );
          })}
        </div>

        <ApplicationFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(initialFilters)}
          aside={applicationsApi.isUsingFallback ? <ApiStatusIndicator usingMock /> : null}
        />

        {emptyAll ? (
          <EmptyState
            title={t("applications.empty.title")}
            description={t("applications.empty.description")}
          />
        ) : emptyFiltered ? (
          <EmptyState
            title={t("applications.empty.noMatch")}
            description={t("applications.empty.adjustFilters")}
            actionLabel={t("empty.clearFilters")}
            onAction={() => setFilters(initialFilters)}
          />
        ) : (
          <>
            {/* Mobile: card grid */}
            <div className="grid min-w-0 gap-3 md:hidden">
              {filteredApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onView={handleView}
                  onMarkFollowUpSent={(id) => void handleMarkFollowUpSent(id)}
                />
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block">
              <ApplicationsTable
                applications={filteredApplications}
                onView={handleView}
                onMarkFollowUpSent={(id) => void handleMarkFollowUpSent(id)}
              />
            </div>
          </>
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
        onSimulateReply={
          applicationsApi.isUsingFallback && selectedApplication
            ? () => void handleSimulateReply(selectedApplication)
            : undefined
        }
        pendingAction={pendingAction}
      />

      <LogApplicationModal
        open={isLogApplicationOpen}
        onClose={() => setIsLogApplicationOpen(false)}
        onSubmit={handleLogApplication}
        loading={applicationsApi.createApplicationLoading}
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
              <h3 className="text-lg font-semibold text-foreground">{t("applications.schedule.title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("applications.schedule.subtitle")}</p>
              <div className="mt-4 space-y-3">
                <label className="block text-xs font-medium text-muted-foreground">
                  {t("applications.schedule.dateLabel")}
                  <Input
                    className="mt-1"
                    type="datetime-local"
                    value={scheduleLocal}
                    onChange={(e) => setScheduleLocal(e.target.value)}
                  />
                </label>
                <label className="block text-xs font-medium text-muted-foreground">
                  {t("applications.schedule.messageLabel")}
                  <Input
                    className="mt-1"
                    value={scheduleMessage}
                    onChange={(e) => setScheduleMessage(e.target.value)}
                    placeholder={t("applications.schedule.messagePlaceholder")}
                  />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>
                  {t("applications.schedule.cancel")}
                </Button>
                <Button type="button" onClick={() => void confirmScheduleFollowUp()}>
                  {t("applications.schedule.confirm")}
                </Button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
