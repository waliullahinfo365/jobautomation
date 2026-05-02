"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InterviewsIcon, PlusIcon, RefreshIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import type {
  AwaitingConfirmationInterview,
  CompletedInterview,
  Interview,
  InterviewOutcome,
  InterviewTab,
  PrepTask,
} from "@/types/interview";
import { calendarSyncStatus, interviewAutomationLogs, prepTasks as initialPrepTasks } from "@/data/mockInterviews";
import { InterviewStatsCards } from "./InterviewStatsCards";
import { InterviewTabs } from "./InterviewTabs";
import { InterviewFilters, type InterviewFilterState } from "./InterviewFilters";
import { UpcomingInterviewsSection } from "./UpcomingInterviewsSection";
import { CalendarWeekView } from "./CalendarWeekView";
import { CalendarSyncStatusCard } from "./CalendarSyncStatusCard";
import { PrepTasksSection } from "./PrepTasksSection";
import { CompletedInterviewsSection } from "./CompletedInterviewsSection";
import { AwaitingConfirmationSection } from "./AwaitingConfirmationSection";
import { InterviewAutomationLogs } from "./InterviewAutomationLogs";
import { InterviewDetailPanel } from "./InterviewDetailPanel";
import { useInterviewsApi } from "@/hooks/api/useInterviewsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { getResourceId, normalizeInterviewsForUi } from "@/lib/utils/resource";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";
import { DEMO_TENANT_ID, DEMO_USER_ID } from "@/config/env";
import { AnimatePresence, motion } from "framer-motion";

const initialFilters: InterviewFilterState = {
  query: "",
  interviewType: "All",
  interviewStatus: "All",
  dateRange: "All Dates",
};

function scheduleDefaultLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setHours(14, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function InterviewsPageClient() {
  const interviewsApi = useInterviewsApi({ fallbackToMock: true });

  const [tab, setTab] = useState<InterviewTab>("Upcoming");
  const [filters, setFilters] = useState<InterviewFilterState>(initialFilters);
  const [prepTasks, setPrepTasks] = useState<PrepTask[]>(initialPrepTasks);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [fallbackEdits, setFallbackEdits] = useState<Record<string, Partial<Interview>>>({});
  const [hiddenAwaitingIds, setHiddenAwaitingIds] = useState<Set<string>>(new Set());
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    company: "",
    position: "",
    interviewType: "Technical" as Interview["interviewType"],
    dateTimeLocal: scheduleDefaultLocal(),
    contactEmail: "",
  });
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const baseInterviews = useMemo(() => {
    const raw = normalizeListResponse<unknown>(interviewsApi.data);
    const normalized = normalizeInterviewsForUi(raw);
    return normalized.length > 0 ? normalized : [];
  }, [interviewsApi.data]);

  useEffect(() => {
    if (!interviewsApi.isUsingFallback) setFallbackEdits({});
  }, [interviewsApi.isUsingFallback]);

  const interviews = useMemo(() => {
    if (!interviewsApi.isUsingFallback || Object.keys(fallbackEdits).length === 0) return baseInterviews;
    return baseInterviews.map((iv) => {
      const id = getResourceId(iv);
      const ed = fallbackEdits[id];
      return ed ? ({ ...iv, ...ed } as Interview) : iv;
    });
  }, [baseInterviews, interviewsApi.isUsingFallback, fallbackEdits]);

  useEffect(() => {
    if (!selectedInterview) return;
    const sid = getResourceId(selectedInterview);
    const fresh = interviews.find((i) => getResourceId(i) === sid);
    if (!fresh) return;
    if (
      fresh.status !== selectedInterview.status ||
      fresh.calendarStatus !== selectedInterview.calendarStatus ||
      fresh.calendarEventId !== selectedInterview.calendarEventId
    ) {
      setSelectedInterview(fresh);
    }
  }, [interviews, selectedInterview]);

  const awaitingItems = useMemo((): AwaitingConfirmationInterview[] => {
    return interviews
      .filter((i) => i.status === "Awaiting Confirmation")
      .filter((i) => !hiddenAwaitingIds.has(i.id))
      .map((i) => ({
        id: i.id,
        company: i.company,
        position: i.position,
        proposedTime: i.dateTime,
        contact: i.contactEmail || "—",
        sourceEmailSubject: "Interview scheduling thread",
        aiDetectedIntent: "Awaiting your confirmation on proposed time.",
      }));
  }, [interviews, hiddenAwaitingIds]);

  const completedRows = useMemo((): CompletedInterview[] => {
    return interviews
      .filter((i) => i.status === "Completed")
      .map((i) => ({
        id: i.id,
        company: i.company,
        position: i.position,
        interviewType: i.interviewType,
        completedDate: i.dateTime,
        outcome: "Waiting Feedback" as InterviewOutcome,
        notesSummary: i.notesSummary || "—",
        followUpSent: false,
      }));
  }, [interviews]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    return {
      totalInterviews: interviews.length,
      thisWeek: interviews.filter((i) => new Date(i.dateTime) >= now && new Date(i.dateTime) <= weekEnd).length,
      awaitingConfirmation: awaitingItems.length,
      prepTasksDue: prepTasks.filter((t) => t.status !== "Done").length,
      completedInterviews: interviews.filter((i) => i.status === "Completed").length,
      calendarSynced: interviews.filter((i) => i.calendarStatus === "Synced").length,
    };
  }, [interviews, prepTasks, awaitingItems.length]);

  const filteredUpcoming = useMemo(() => {
    return interviews.filter((i) => {
      if (["Completed", "Cancelled", "No Show"].includes(i.status)) return false;
      const term = `${i.company} ${i.position} ${i.interviewerName} ${i.contactEmail}`.toLowerCase();
      const matchesQuery = !filters.query || term.includes(filters.query.toLowerCase());
      const matchesType = filters.interviewType === "All" || i.interviewType === filters.interviewType;
      const matchesStatus = filters.interviewStatus === "All" || i.status === filters.interviewStatus;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [interviews, filters]);

  const patchFallback = useCallback((id: string, patch: Partial<Interview>) => {
    setFallbackEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const toastQueuedPayload = (label: string, result: unknown) => {
    const r = result && typeof result === "object" ? (result as Record<string, unknown>) : {};
    const parts = [
      r.operationId != null && `operationId: ${String(r.operationId)}`,
      r.jobId != null && `jobId: ${String(r.jobId)}`,
      r.status != null && `status: ${String(r.status)}`,
      r.calendarEventId != null && `calendarEventId: ${String(r.calendarEventId)}`,
    ].filter(Boolean);
    showSuccess(parts.length ? `${label}: ${parts.join(" · ")}` : `${label} queued.`);
  };

  const handleMarkComplete = async (id: string) => {
    if (interviewsApi.isUsingFallback) {
      patchFallback(id, { status: "Completed" });
      showInfo("API offline, updated demo data locally.");
      showSuccess("Interview marked complete.");
      return;
    }
    try {
      await interviewsApi.markComplete(id);
      showSuccess("Interview marked complete.");
      await interviewsApi.refetch();
    } catch {
      showError("Could not mark interview complete.");
    }
  };

  const handleCreateCalendarEvent = async (id: string) => {
    setPendingAction("cal");
    try {
      if (interviewsApi.isUsingFallback) {
        patchFallback(id, {
          calendarStatus: "Synced",
          calendarEventId: `cal_stub_${Date.now()}`,
        });
        showInfo("API offline, updated demo data locally.");
        showSuccess("Calendar event created (demo).");
        return;
      }
      try {
        const result = await interviewsApi.createCalendarEvent({ id, execute: false });
        toastQueuedPayload("Calendar event", result);
        await interviewsApi.refetch();
      } catch {
        showError("Could not queue calendar event.");
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleScheduleInterviewSubmit = async () => {
    if (!scheduleForm.company.trim() || !scheduleForm.position.trim()) {
      showError("Company and position are required.");
      return;
    }
    const dateTime = new Date(scheduleForm.dateTimeLocal).toISOString();
    setScheduleOpen(false);
    if (interviewsApi.isUsingFallback) {
      showInfo("API offline, updated demo data locally.");
      showSuccess("Interview scheduled (demo only — API unavailable).");
      return;
    }
    try {
      await interviewsApi.createInterview({
        tenantId: DEMO_TENANT_ID,
        createdBy: DEMO_USER_ID,
        company: scheduleForm.company.trim(),
        position: scheduleForm.position.trim(),
        interviewType: scheduleForm.interviewType,
        dateTime,
        status: "Scheduled",
        prepStatus: "Not Started",
      });
      showSuccess("Interview scheduled.");
      await interviewsApi.refetch();
      setScheduleForm({
        company: "",
        position: "",
        interviewType: "Technical",
        dateTimeLocal: scheduleDefaultLocal(),
        contactEmail: "",
      });
    } catch {
      showError("Could not create interview.");
    }
  };

  const markTaskDone = (id: string) => {
    setPrepTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "Done" } : t)));
  };

  const confirmAwaiting = (id: string) => {
    setHiddenAwaitingIds((prev) => new Set(prev).add(id));
  };

  const isInitialLoading = interviewsApi.loading && interviewsApi.data === undefined;

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={InterviewsIcon}
          eyebrow="Interview Scheduler"
          title="Interviews"
          description="Track interviews, prep tasks, calendar events, and scheduling automation."
          actions={
            <>
              <Button variant="outline" type="button">
                <RefreshIcon size={16} className="mr-2" />
                Sync Calendar
              </Button>
              <Button type="button">
                <PlusIcon size={16} className="mr-2" />
                Schedule Interview
              </Button>
            </>
          }
        />
        <LoadingState title="Loading interviews..." description="Fetching interview pipeline data." />
      </div>
    );
  }

  const emptyAll = interviews.length === 0;
  const emptyFiltered = !emptyAll && filteredUpcoming.length === 0 && tab === "Upcoming";

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          icon={InterviewsIcon}
          eyebrow="Interview Scheduler"
          title="Interviews"
          description="Track interviews, prep tasks, calendar events, and scheduling automation."
          actions={
            <>
              <Button variant="outline" type="button" onClick={() => showInfo("Calendar sync will be available after Google OAuth is connected.")}>
                <RefreshIcon size={16} className="mr-2" />
                Sync Calendar
              </Button>
              <Button type="button" onClick={() => setScheduleOpen(true)}>
                <PlusIcon size={16} className="mr-2" />
                Schedule Interview
              </Button>
            </>
          }
        />

        <InterviewStatsCards stats={stats} />
        <InterviewTabs value={tab} onChange={setTab} />

        {tab === "Upcoming" ? (
          <>
            <InterviewFilters
              filters={filters}
              onChange={setFilters}
              onClear={() => setFilters(initialFilters)}
              aside={interviewsApi.isUsingFallback ? <ApiStatusIndicator usingMock /> : null}
            />
            {emptyAll ? (
              <EmptyState title="No interviews scheduled" description="Schedule an interview or connect your calendar when OAuth is ready." />
            ) : emptyFiltered ? (
              <EmptyState
                title="No matching interviews"
                description="Adjust filters or search."
                actionLabel="Clear filters"
                onAction={() => setFilters(initialFilters)}
              />
            ) : (
              <UpcomingInterviewsSection
                interviews={filteredUpcoming}
                onView={(interview) => {
                  setSelectedInterview(interview);
                  setPanelOpen(true);
                }}
                onMarkComplete={(interviewId) => void handleMarkComplete(interviewId)}
              />
            )}
          </>
        ) : null}

        {tab === "Calendar View" ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <CalendarWeekView interviews={interviews} />
            </div>
            <CalendarSyncStatusCard status={calendarSyncStatus} />
          </div>
        ) : null}

        {tab === "Prep Tasks" ? <PrepTasksSection tasks={prepTasks} onMarkDone={markTaskDone} /> : null}
        {tab === "Completed" ? <CompletedInterviewsSection interviews={completedRows} /> : null}
        {tab === "Awaiting Confirmation" ? (
          awaitingItems.length === 0 ? (
            <EmptyState title="Nothing awaiting confirmation" description="Scheduling threads will appear here." />
          ) : (
            <AwaitingConfirmationSection items={awaitingItems} onConfirm={confirmAwaiting} />
          )
        ) : null}
        {tab === "Automation Logs" ? <InterviewAutomationLogs logs={interviewAutomationLogs} /> : null}
      </div>

      <InterviewDetailPanel
        interview={selectedInterview}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onCreateCalendarEvent={
          selectedInterview ? () => void handleCreateCalendarEvent(getResourceId(selectedInterview)) : undefined
        }
        onMarkComplete={
          selectedInterview ? () => void handleMarkComplete(getResourceId(selectedInterview)) : undefined
        }
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
              <h3 className="text-lg font-semibold text-foreground">Schedule interview</h3>
              <p className="mt-1 text-sm text-muted-foreground">Creates an interview via the API.</p>
              <div className="mt-4 grid gap-3">
                <label className="text-xs font-medium text-muted-foreground">
                  Company *
                  <Input
                    className="mt-1"
                    value={scheduleForm.company}
                    onChange={(e) => setScheduleForm((s) => ({ ...s, company: e.target.value }))}
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Position *
                  <Input
                    className="mt-1"
                    value={scheduleForm.position}
                    onChange={(e) => setScheduleForm((s) => ({ ...s, position: e.target.value }))}
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Interview type
                  <Select
                    className="mt-1"
                    value={scheduleForm.interviewType}
                    onChange={(e) =>
                      setScheduleForm((s) => ({ ...s, interviewType: e.target.value as Interview["interviewType"] }))
                    }
                    options={[
                      { label: "Recruiter Screen", value: "Recruiter Screen" },
                      { label: "Technical", value: "Technical" },
                      { label: "Behavioral", value: "Behavioral" },
                      { label: "Hiring Manager", value: "Hiring Manager" },
                      { label: "Panel", value: "Panel" },
                      { label: "Final Round", value: "Final Round" },
                      { label: "Offer Discussion", value: "Offer Discussion" },
                    ]}
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Date & time
                  <Input
                    className="mt-1"
                    type="datetime-local"
                    value={scheduleForm.dateTimeLocal}
                    onChange={(e) => setScheduleForm((s) => ({ ...s, dateTimeLocal: e.target.value }))}
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Contact email
                  <Input
                    className="mt-1"
                    type="email"
                    value={scheduleForm.contactEmail}
                    onChange={(e) => setScheduleForm((s) => ({ ...s, contactEmail: e.target.value }))}
                  />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => void handleScheduleInterviewSubmit()}>
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
