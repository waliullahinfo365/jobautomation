"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InterviewsIcon, PlusIcon, RefreshIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import type {
  AwaitingConfirmationInterview,
  CalendarSyncStatus,
  CompletedInterview,
  Interview,
  InterviewAutomationLog,
  InterviewOutcome,
  InterviewTab,
  PrepTask,
  PrepTaskType,
} from "@/types/interview";
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
import { useIntegrationsApi } from "@/hooks/api/useIntegrationsApi";
import { normalizeListResponse } from "@/lib/api/normalizeResource";
import { apiFetch, withQuery } from "@/lib/api/client";
import { getResourceId, normalizeInterviewsForUi } from "@/lib/utils/resource";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { showSuccess, showError, showInfo } from "@/lib/ui/toast";
import { AnimatePresence, motion } from "framer-motion";

const LABEL_TO_TASK_TYPE: [RegExp, PrepTaskType][] = [
  [/research|company/i, "Research Company"],
  [/job.?description|role|jd/i, "Review Job Description"],
  [/practice|star|behavioral|answer/i, "Practice Answers"],
  [/technical|coding|architect|algorithm/i, "Technical Prep"],
  [/question/i, "Prepare Questions"],
  [/portfolio|case.?study/i, "Portfolio Review"],
];

function inferTaskType(label: string): PrepTaskType {
  for (const [pattern, type] of LABEL_TO_TASK_TYPE) {
    if (pattern.test(label)) return type;
  }
  return "Research Company";
}

function computePrepTasksFromInterviews(interviews: Interview[], doneTaskIds: Set<string>): PrepTask[] {
  const now = Date.now();
  return interviews
    .filter((iv) => !["Completed", "Cancelled", "No Show"].includes(iv.status))
    .flatMap((iv) => {
      const due = new Date(new Date(iv.dateTime).getTime() - 24 * 60 * 60 * 1000);
      return iv.prepChecklist.map((item) => {
        const taskId = `${iv.id}__${item.id}`;
        const isDone = item.done || doneTaskIds.has(taskId);
        return {
          id: taskId,
          interviewId: iv.id,
          company: iv.company,
          position: iv.position,
          title: item.label,
          taskType: inferTaskType(item.label),
          dueDate: due.toISOString(),
          priority: "Medium" as const,
          status: isDone ? ("Done" as const) : due.getTime() < now ? ("Overdue" as const) : ("Not Started" as const),
        };
      });
    });
}

function normalizeApiLogToInterviewLog(raw: unknown, idx: number): InterviewAutomationLog {
  const r = (raw ?? {}) as Record<string, unknown>;
  const moduleKey = String(r.moduleKey ?? r.moduleName ?? "");
  const module: InterviewAutomationLog["module"] =
    moduleKey.includes("email-reply") ? "Email Reply Detection"
    : moduleKey.includes("follow-up") ? "Follow-Up Reminder Engine"
    : moduleKey.includes("calendar") ? "Calendar Sync"
    : "Interview Scheduling Automation";
  const rawStatus = String(r.status ?? "");
  const status: InterviewAutomationLog["status"] =
    rawStatus === "Success" ? "success" : rawStatus === "Warning" ? "warning" : "error";
  const meta = (r.metadata ?? {}) as Record<string, unknown>;
  return {
    id: String(r._id ?? r.id ?? idx),
    time: String(r.createdAt ?? r.timestamp ?? new Date().toISOString()),
    module,
    status,
    message: String(r.message ?? ""),
    relatedInterview: r.relatedRecordId ? String(r.relatedRecordId).slice(-6) : "—",
    durationMs: Number(meta.durationMs ?? 0),
  };
}

function deriveCalendarSyncStatus(integrations: unknown[]): CalendarSyncStatus {
  const cal = integrations.find((i) => {
    const item = (i ?? {}) as Record<string, unknown>;
    return String(item.provider ?? "").toLowerCase().includes("calendar") ||
           String(item.slug ?? "").toLowerCase().includes("calendar");
  });
  const item = (cal ?? {}) as Record<string, unknown>;
  const isConnected = String(item.status ?? "") === "Connected";
  return {
    googleCalendar: isConnected ? "Connected" : "Not connected",
    lastSync: String(item.lastSyncAt ?? item.updatedAt ?? new Date().toISOString()),
    nextSync: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  };
}

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
  const { t } = useTranslation();
  const interviewsApi = useInterviewsApi({ fallbackToMock: false });
  const integrationsApi = useIntegrationsApi({ fallbackToMock: false });

  const [tab, setTab] = useState<InterviewTab>("Upcoming");
  const [filters, setFilters] = useState<InterviewFilterState>(initialFilters);
  const [doneTaskIds, setDoneTaskIds] = useState<Set<string>>(new Set());
  const [liveAutoLogs, setLiveAutoLogs] = useState<InterviewAutomationLog[]>([]);
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

  useEffect(() => {
    if (tab !== "Automation Logs") return;
    apiFetch<{ data?: unknown[] } | unknown[]>(
      withQuery("/automation/logs", { moduleKey: "interview-scheduling", limit: "50" })
    )
      .then((res) => {
        const rows = Array.isArray(res) ? res : (Array.isArray((res as { data?: unknown[] }).data) ? (res as { data: unknown[] }).data : []);
        setLiveAutoLogs(rows.map(normalizeApiLogToInterviewLog));
      })
      .catch(() => {});
  }, [tab]);

  const interviews = useMemo(() => {
    if (!interviewsApi.isUsingFallback || Object.keys(fallbackEdits).length === 0) return baseInterviews;
    return baseInterviews.map((iv) => {
      const id = getResourceId(iv);
      const ed = fallbackEdits[id];
      return ed ? ({ ...iv, ...ed } as Interview) : iv;
    });
  }, [baseInterviews, interviewsApi.isUsingFallback, fallbackEdits]);

  const prepTasks = useMemo(
    () => computePrepTasksFromInterviews(interviews, doneTaskIds),
    [interviews, doneTaskIds]
  );

  const calendarSyncStatus = useMemo(() => {
    const raw = normalizeListResponse<unknown>(integrationsApi.integrations);
    return deriveCalendarSyncStatus(raw);
  }, [integrationsApi.integrations]);

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
      showInfo(t("interviews.toast.offlineDemo"));
      showSuccess(t("interviews.toast.markedComplete"));
      return;
    }
    try {
      await interviewsApi.markComplete(id);
      showSuccess(t("interviews.toast.markedComplete"));
      await interviewsApi.refetch();
    } catch {
      showError(t("interviews.toast.couldNotMarkComplete"));
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
        showInfo(t("interviews.toast.offlineDemo"));
        showSuccess(t("interviews.toast.calendarEventCreated"));
        return;
      }
      try {
        const result = await interviewsApi.createCalendarEvent({ id, execute: false });
        toastQueuedPayload("Calendar event", result);
        await interviewsApi.refetch();
      } catch {
        showError(t("interviews.toast.couldNotQueueCalendar"));
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleScheduleInterviewSubmit = async () => {
    if (!scheduleForm.company.trim() || !scheduleForm.position.trim()) {
      showError(t("interviews.schedule.companyAndPositionRequired"));
      return;
    }
    const dateTime = new Date(scheduleForm.dateTimeLocal).toISOString();
    setScheduleOpen(false);
    if (interviewsApi.isUsingFallback) {
      showInfo(t("interviews.toast.offlineDemo"));
      showSuccess(t("interviews.toast.scheduledDemo"));
      return;
    }
    try {
      await interviewsApi.createInterview({
        company: scheduleForm.company.trim(),
        position: scheduleForm.position.trim(),
        interviewType: scheduleForm.interviewType,
        dateTime,
        status: "Scheduled",
        prepStatus: "Not Started",
      });
      showSuccess(t("interviews.toast.scheduled"));
      await interviewsApi.refetch();
      setScheduleForm({
        company: "",
        position: "",
        interviewType: "Technical",
        dateTimeLocal: scheduleDefaultLocal(),
        contactEmail: "",
      });
    } catch {
      showError(t("interviews.toast.couldNotCreate"));
    }
  };

  const markTaskDone = useCallback(
    (taskId: string) => {
      setDoneTaskIds((prev) => new Set(prev).add(taskId));
      const [interviewId, itemId] = taskId.split("__");
      if (!interviewId || !itemId || interviewsApi.isUsingFallback) return;
      const interview = interviews.find((iv) => iv.id === interviewId);
      if (!interview) return;
      const updatedChecklist = interview.prepChecklist.map((item) =>
        item.id === itemId ? { ...item, done: true } : item
      );
      void interviewsApi.updateInterview({ id: interviewId, payload: { prepChecklist: updatedChecklist } });
    },
    [interviews, interviewsApi]
  );

  const confirmAwaiting = (id: string) => {
    setHiddenAwaitingIds((prev) => new Set(prev).add(id));
  };

  const isInitialLoading = interviewsApi.loading && interviewsApi.data === undefined;

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={InterviewsIcon}
          eyebrow={t("interviews.eyebrow")}
          title={t("interviews.title")}
          description={t("interviews.description")}
          actions={
            <>
              <Button variant="outline" type="button">
                <RefreshIcon size={16} className="mr-2" />
                {t("interviews.syncCalendar")}
              </Button>
              <Button type="button">
                <PlusIcon size={16} className="mr-2" />
                {t("interviews.scheduleInterview")}
              </Button>
            </>
          }
        />
        <LoadingState title={t("interviews.loadingTitle")} description={t("interviews.loadingDesc")} />
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
          eyebrow={t("interviews.eyebrow")}
          title={t("interviews.title")}
          description={t("interviews.description")}
          actions={
            <>
              <Button variant="outline" type="button" onClick={() => showInfo(t("error.calendarSyncNote"))}>
                <RefreshIcon size={16} className="mr-2" />
                {t("interviews.syncCalendar")}
              </Button>
              <Button type="button" onClick={() => setScheduleOpen(true)}>
                <PlusIcon size={16} className="mr-2" />
                {t("interviews.scheduleInterview")}
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
              <EmptyState title={t("empty.noInterviewsScheduled")} description={t("empty.noInterviewsScheduledDesc")} />
            ) : emptyFiltered ? (
              <EmptyState
                title={t("interviews.empty.noMatching")}
                description={t("interviews.empty.adjustFilters")}
                actionLabel={t("empty.clearFilters")}
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
            <EmptyState title={t("interviews.empty.noAwaitingConfirmation")} description={t("interviews.empty.awaitingConfirmationBody")} />
          ) : (
            <AwaitingConfirmationSection items={awaitingItems} onConfirm={confirmAwaiting} />
          )
        ) : null}
        {tab === "Automation Logs" ? <InterviewAutomationLogs logs={liveAutoLogs} /> : null}
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
              <h3 className="text-lg font-semibold text-foreground">{t("interviews.schedule.title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("interviews.schedule.subtitle")}</p>
              <div className="mt-4 grid gap-3">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("interviews.schedule.company")}
                  <Input
                    className="mt-1"
                    value={scheduleForm.company}
                    onChange={(e) => setScheduleForm((s) => ({ ...s, company: e.target.value }))}
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("interviews.schedule.position")}
                  <Input
                    className="mt-1"
                    value={scheduleForm.position}
                    onChange={(e) => setScheduleForm((s) => ({ ...s, position: e.target.value }))}
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("interviews.schedule.interviewType")}
                  <Select
                    className="mt-1"
                    value={scheduleForm.interviewType}
                    onChange={(e) =>
                      setScheduleForm((s) => ({ ...s, interviewType: e.target.value as Interview["interviewType"] }))
                    }
                    options={[
                      { label: t("interviews.interviewType.recruiterScreen"), value: "Recruiter Screen" },
                      { label: t("interviews.interviewType.technical"), value: "Technical" },
                      { label: t("interviews.interviewType.behavioral"), value: "Behavioral" },
                      { label: t("interviews.interviewType.hiringManager"), value: "Hiring Manager" },
                      { label: t("interviews.interviewType.panel"), value: "Panel" },
                      { label: t("interviews.interviewType.finalRound"), value: "Final Round" },
                      { label: t("interviews.interviewType.offerDiscussion"), value: "Offer Discussion" },
                    ]}
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("interviews.schedule.dateAndTime")}
                  <Input
                    className="mt-1"
                    type="datetime-local"
                    value={scheduleForm.dateTimeLocal}
                    onChange={(e) => setScheduleForm((s) => ({ ...s, dateTimeLocal: e.target.value }))}
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("interviews.schedule.contactEmail")}
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
                  {t("interviews.schedule.cancel")}
                </Button>
                <Button type="button" onClick={() => void handleScheduleInterviewSubmit()}>
                  {t("interviews.schedule.confirm")}
                </Button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
