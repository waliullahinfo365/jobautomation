"use client";

import { MotionCard } from "@/components/shared/MotionCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/config/env";
import {
  buildDemoIntakePayload,
  buildDemoReplyPayload,
  getFirstAvailableApplication,
  getFirstAvailableDocument,
  getFirstAvailableInterview,
  getFirstAvailableJob,
} from "@/lib/demo/demoFlow";
import * as applicationsApi from "@/lib/api/applications.api";
import * as automationApi from "@/lib/api/automation.api";
import * as billingApi from "@/lib/api/billing.api";
import { resetDemoData } from "@/lib/api/demo.api";
import * as documentsApi from "@/lib/api/documents.api";
import * as integrationsApi from "@/lib/api/integrations.api";
import * as interviewsApi from "@/lib/api/interviews.api";
import * as jobsApi from "@/lib/api/jobs.api";
import * as reportsApi from "@/lib/api/reports.api";
import { showError, showSuccess } from "@/lib/ui/toast";
import type { DemoStep, DemoStepResult, DemoStepStatus } from "@/types/demo";
import { useApplicationsApi } from "@/hooks/api/useApplicationsApi";
import { useDocumentsApi } from "@/hooks/api/useDocumentsApi";
import { useIntegrationsApi } from "@/hooks/api/useIntegrationsApi";
import { useJobsApi } from "@/hooks/api/useJobsApi";
import { useInterviewsApi } from "@/hooks/api/useInterviewsApi";
import { cn } from "@/lib/utils";
import {
  ActivityIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CircleDashedIcon,
  DemoIcon,
  LoaderIcon,
  PlayIcon,
  RotateCcwIcon,
  SparklesIcon,
  XCircleIcon,
} from "@/components/icons";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

const STEP_DEFS: DemoStep[] = [
  {
    id: "integrations",
    order: 1,
    title: "Connect demo integrations",
    description: "Open Settings → Integrations and review Gmail, Drive, Calendar, and OpenAI (stub) status.",
    linkHref: "/settings",
    linkLabel: "Integrations",
  },
  {
    id: "intake",
    order: 2,
    title: "Intake test job",
    description: "Posts a synthetic job alert through the intake-test pipeline.",
    linkHref: "/jobs",
    linkLabel: "Jobs",
  },
  {
    id: "duplicate",
    order: 3,
    title: "Check duplicate protection",
    description: "Runs duplicate fingerprinting on the first available job.",
    linkHref: "/jobs",
    linkLabel: "Jobs",
  },
  {
    id: "research",
    order: 4,
    title: "Generate research",
    description: "Queues or runs research generation for the first job (execute in dev only).",
    linkHref: "/jobs",
    linkLabel: "Jobs",
  },
  {
    id: "draft",
    order: 5,
    title: "Generate cover letter draft",
    description: "Queues or runs draft generation for the first job.",
    linkHref: "/jobs",
    linkLabel: "Jobs",
  },
  {
    id: "applied",
    order: 6,
    title: "Mark application applied",
    description: "Marks the first application as applied when eligible.",
    linkHref: "/applications",
    linkLabel: "Applications",
  },
  {
    id: "followups",
    order: 7,
    title: "Process follow-up reminders",
    description: "Runs the due follow-up processor for scheduled nudges.",
    linkHref: "/applications",
    linkLabel: "Applications",
  },
  {
    id: "reply",
    order: 8,
    title: "Simulate recruiter reply",
    description: "Sends a stub Gmail reply payload through reply detection.",
    linkHref: "/applications",
    linkLabel: "Applications",
  },
  {
    id: "calendar",
    order: 9,
    title: "Create calendar event",
    description: "Creates a calendar event stub for the first interview.",
    linkHref: "/interviews",
    linkLabel: "Interviews",
  },
  {
    id: "pdf",
    order: 10,
    title: "Export PDF",
    description: "Triggers PDF export for the first document.",
    linkHref: "/documents",
    linkLabel: "Documents",
  },
  {
    id: "daily",
    order: 11,
    title: "Generate daily digest",
    description: "Runs the daily digest generator.",
    linkHref: "/reports",
    linkLabel: "Reports",
  },
  {
    id: "weekly",
    order: 12,
    title: "Generate weekly report",
    description: "Runs the weekly performance report generator.",
    linkHref: "/reports",
    linkLabel: "Reports",
  },
  {
    id: "logs",
    order: 13,
    title: "Review automation logs",
    description: "Fetches recent automation logs for this workspace.",
    linkHref: "/automation",
    linkLabel: "Automation",
  },
  {
    id: "billing",
    order: 14,
    title: "Review billing usage",
    description: "Loads the billing plan and usage snapshot.",
    linkHref: "/settings",
    linkLabel: "Billing",
  },
];

function compactPreview(data: unknown, max = 900): string {
  try {
    const s = JSON.stringify(data, null, 2);
    return s.length > max ? `${s.slice(0, max)}…` : s;
  } catch {
    return String(data);
  }
}

function statusIcon(status: DemoStepStatus) {
  switch (status) {
    case "Completed":
      return <CheckCircleIcon size={20} className="text-[var(--emerald)]" />;
    case "Failed":
      return <XCircleIcon size={20} className="text-[var(--rose)]" />;
    case "Running":
      return <LoaderIcon size={20} className="text-[var(--accent)]" />;
    default:
      return <CircleDashedIcon size={20} className="text-[var(--text-3)]" />;
  }
}

export function DemoWalkthroughClient() {
  const jobsApiHook = useJobsApi({ fallbackToMock: true });
  const applicationsApiHook = useApplicationsApi({ fallbackToMock: true });
  const interviewsApiHook = useInterviewsApi({ fallbackToMock: true });
  const documentsApiHook = useDocumentsApi({ fallbackToMock: true });
  const integrationsApiHook = useIntegrationsApi({ fallbackToMock: true });

  const [statusMap, setStatusMap] = useState<Record<string, DemoStepStatus>>(() =>
    Object.fromEntries(STEP_DEFS.map((s) => [s.id, "Not Started" as const]))
  );
  const [resultMap, setResultMap] = useState<Record<string, DemoStepResult>>({});
  const [resetLoading, setResetLoading] = useState(false);
  const [resetBanner, setResetBanner] = useState<string | null>(null);

  const job = useMemo(
    () => getFirstAvailableJob(jobsApiHook.list as never),
    [jobsApiHook.list]
  );
  const application = useMemo(
    () => getFirstAvailableApplication(applicationsApiHook.list as never),
    [applicationsApiHook.list]
  );
  const interview = useMemo(
    () => getFirstAvailableInterview(interviewsApiHook.list as never),
    [interviewsApiHook.list]
  );
  const document = useMemo(
    () => getFirstAvailableDocument(documentsApiHook.list as never),
    [documentsApiHook.list]
  );

  const allowExecute = env.app.isDev;

  const runStep = useCallback(
    async (stepId: string) => {
      setStatusMap((m) => ({ ...m, [stepId]: "Running" }));
      setResultMap((m) => ({ ...m, [stepId]: {} }));

      const fail = (message: string) => {
        setStatusMap((m) => ({ ...m, [stepId]: "Failed" }));
        setResultMap((m) => ({ ...m, [stepId]: { error: message } }));
      };

      const ok = (raw: unknown, preview?: string) => {
        setStatusMap((m) => ({ ...m, [stepId]: "Completed" }));
        setResultMap((m) => ({
          ...m,
          [stepId]: { raw, preview: preview ?? compactPreview(raw) },
        }));
      };

      try {
        switch (stepId) {
          case "integrations": {
            await integrationsApiHook.refetch();
            const integrations = await integrationsApi.listIntegrations();
            const health = await integrationsApi.getIntegrationHealth();
            ok(
              { integrations, health },
              compactPreview({ providers: integrations?.length ?? 0, healthSummary: health })
            );
            break;
          }
          case "intake": {
            const res = await jobsApi.intakeTest(buildDemoIntakePayload());
            ok(res);
            void jobsApiHook.refetch?.();
            break;
          }
          case "duplicate": {
            const jid = job?.id ?? job?._id;
            if (!jid) {
              fail("No job available — open Jobs or enable mock fallback.");
              break;
            }
            const res = await jobsApi.checkDuplicate(jid);
            ok(res);
            break;
          }
          case "research": {
            const jid = job?.id ?? job?._id;
            if (!jid) {
              fail("No job available for research.");
              break;
            }
            try {
              const res = await jobsApi.generateResearch(jid, { execute: allowExecute });
              ok(res);
            } catch (e) {
              const res = await jobsApi.generateResearch(jid, { execute: false });
              ok(res, compactPreview(res));
            }
            break;
          }
          case "draft": {
            const jid = job?.id ?? job?._id;
            if (!jid) {
              fail("No job available for draft.");
              break;
            }
            try {
              const res = await jobsApi.generateDraft(jid, { execute: allowExecute });
              ok(res);
            } catch {
              const res = await jobsApi.generateDraft(jid, { execute: false });
              ok(res);
            }
            break;
          }
          case "applied": {
            const aid = application?.id ?? application?._id;
            if (!aid) {
              fail("No application available.");
              break;
            }
            const res = await applicationsApi.markApplied(aid, {});
            ok(res);
            void applicationsApiHook.refetch?.();
            break;
          }
          case "followups": {
            const res = await applicationsApi.processDueFollowUps({});
            ok(res);
            break;
          }
          case "reply": {
            if (!application) {
              fail("No application for reply simulation.");
              break;
            }
            const res = await integrationsApi.replyTest(buildDemoReplyPayload(application));
            ok(res);
            void applicationsApiHook.refetch?.();
            break;
          }
          case "calendar": {
            const iid = interview?.id ?? interview?._id;
            if (!iid) {
              fail("No interview available.");
              break;
            }
            try {
              const res = await interviewsApi.createCalendarEvent(iid, { execute: allowExecute });
              ok(res);
            } catch {
              const res = await interviewsApi.createCalendarEvent(iid, { execute: false });
              ok(res);
            }
            break;
          }
          case "pdf": {
            const did = document?.id ?? document?._id;
            if (!did) {
              fail("No document available.");
              break;
            }
            try {
              const res = await documentsApi.exportPdf(did, { execute: allowExecute });
              ok(res);
            } catch {
              const res = await documentsApi.exportPdf(did, { execute: false });
              ok(res);
            }
            break;
          }
          case "daily": {
            const res = await reportsApi.runDailyDigest({});
            ok(res);
            break;
          }
          case "weekly": {
            const res = await reportsApi.runWeeklyReport({});
            ok(res);
            break;
          }
          case "logs": {
            const res = await automationApi.listAutomationLogs({ limit: 25 });
            ok(res);
            break;
          }
          case "billing": {
            const res = await billingApi.getBillingPlan();
            ok(res);
            break;
          }
          default:
            fail("Unknown step.");
        }
      } catch (err) {
        fail(err instanceof Error ? err.message : "Step failed");
      }
    },
    [
      allowExecute,
      application,
      document,
      integrationsApiHook,
      interview,
      job,
      jobsApiHook,
      applicationsApiHook,
    ]
  );

  const handleReset = async () => {
    setResetBanner(null);
    setResetLoading(true);
    try {
      const summary = await resetDemoData();
      showSuccess("Demo data refreshed.");
      setResetBanner(
        `Reset complete — jobs: ${summary.jobs}, applications: ${summary.applications}, logs: ${summary.automationLogs}.`
      );
      void jobsApiHook.refetch?.();
      void applicationsApiHook.refetch?.();
      void interviewsApiHook.refetch?.();
      void documentsApiHook.refetch?.();
      void integrationsApiHook.refetch();
    } catch (e) {
      const msg = "Demo reset requires the API.";
      showError(msg);
      setResetBanner(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const stepDisabled = (id: string): string | null => {
    switch (id) {
      case "duplicate":
      case "research":
      case "draft":
        return job ? null : "Add a job or use seeded demo data.";
      case "applied":
      case "reply":
        return application ? null : "No application in list.";
      case "calendar":
        return interview ? null : "No interview in list.";
      case "pdf":
        return document ? null : "No document in list.";
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        icon={DemoIcon}
        eyebrow="Product Tour"
        title="Demo Walkthrough"
        description="Investor-ready checklist — each step exercises a live API with mock-safe fallbacks when the API is offline."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/system-status"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex gap-2")}
            >
              <ActivityIcon size={16} />
              System Status
            </Link>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              disabled={resetLoading}
              onClick={() => void handleReset()}
            >
              {resetLoading ? <LoaderIcon size={16} /> : <RotateCcwIcon size={16} />}
              Reset Demo Data
            </Button>
          </div>
        }
      />

      {resetBanner ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          {resetBanner}
        </div>
      ) : null}

      <MotionCard className="overflow-hidden border-border/60 bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-indigo-950/40 p-6 text-slate-50 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <SparklesIcon size={24} className="text-[var(--amber)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Guided narrative</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-300">
                Run steps in order for a clean story. Missing entities disable only the steps that need them — the rest
                still run against your workspace or mock bundle.
              </p>
            </div>
          </div>
          <Badge className="shrink-0 border-white/20 bg-white/10 text-white">Demo mode</Badge>
        </div>
      </MotionCard>

      <div className="grid gap-4">
        {STEP_DEFS.map((step, index) => {
          const st = statusMap[step.id] ?? "Not Started";
          const result = resultMap[step.id];
          const disabledReason = stepDisabled(step.id);
          const alwaysAllowed = new Set([
            "integrations",
            "intake",
            "followups",
            "daily",
            "weekly",
            "logs",
            "billing",
          ]);
          const blocked = Boolean(disabledReason) && !alwaysAllowed.has(step.id);

          return (
            <MotionCard key={step.id} delay={index * 0.03} className="border-border/70">
              <Card className="border-0 bg-transparent shadow-none">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                  <div className="mt-0.5">{statusIcon(st)}</div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-semibold">
                        {step.order}. {step.title}
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {st}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm leading-relaxed">{step.description}</CardDescription>
                    {disabledReason ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400">{disabledReason}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                    <Button
                      size="sm"
                      className="gap-2"
                      disabled={st === "Running" || blocked}
                      onClick={() => void runStep(step.id)}
                    >
                      {st === "Running" ? <LoaderIcon size={16} /> : <PlayIcon size={16} />}
                      Run step
                    </Button>
                    <Link
                      href={step.linkHref}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "gap-1 text-muted-foreground"
                      )}
                    >
                      {step.linkLabel}
                      <ArrowRightIcon size={14} />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {result?.preview || result?.error ? (
                    <div
                      className={cn(
                        "mt-2 rounded-lg border px-3 py-2 font-mono text-xs leading-relaxed",
                        result.error
                          ? "border-red-500/30 bg-red-500/5 text-red-800 dark:text-red-200"
                          : "border-border/60 bg-muted/40 text-muted-foreground"
                      )}
                    >
                      {result.error ?? result.preview}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">Result preview appears after you run the step.</p>
                  )}
                </CardContent>
              </Card>
            </MotionCard>
          );
        })}
      </div>
    </div>
  );
}
