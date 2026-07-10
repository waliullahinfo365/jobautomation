import { TenantModel, IntegrationConnectionModel, JobModel } from "@jobflow/database/models";
import type { EnqueueAutomationJobInput } from "@jobflow/shared/types/queue";
import { enqueueManyAutomationJobs, enqueueAutomationJob } from "../queues/automation.queue";
import { loadSession, saveSession, loadPlaywrightProxyUrl } from "@jobflow/integrations/playwright/session-store";
import { launchBrowser, humanDelay } from "@jobflow/integrations/playwright/browser";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function activeTenantIds() {
  const tenants = await TenantModel.find({ status: { $in: ["Active", "Trialing"] } }).select("_id");
  return tenants.map((tenant) => String(tenant._id));
}

export async function scheduleDailyDigestForAllTenants() {
  const date = todayKey();
  const tenantIds = await activeTenantIds();
  const jobs: EnqueueAutomationJobInput[] = tenantIds.map((tenantId) => ({
    name: "daily-digest",
    payload: {
      tenantId,
      operationId: `daily-digest-${tenantId}-${date}`,
      idempotencyKey: `daily-digest:${tenantId}:${date}`,
      requestedAt: new Date().toISOString(),
      source: "scheduler",
      date,
      send: true,
    },
  }));
  return enqueueManyAutomationJobs(jobs);
}

export async function scheduleWeeklyReportsForAllTenants() {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - day + 1);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);
  const tenantIds = await activeTenantIds();
  const jobs: EnqueueAutomationJobInput[] = tenantIds.map((tenantId) => ({
    name: "weekly-report",
    payload: {
      tenantId,
      operationId: `weekly-report-${tenantId}-${weekStart.toISOString().slice(0, 10)}`,
      idempotencyKey: `weekly-report:${tenantId}:${weekStart.toISOString().slice(0, 10)}:${weekEnd.toISOString().slice(0, 10)}`,
      requestedAt: new Date().toISOString(),
      source: "scheduler",
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      send: true,
    },
  }));
  return enqueueManyAutomationJobs(jobs);
}

export async function scheduleFollowUpReminderSweep() {
  const date = todayKey();
  const tenantIds = await activeTenantIds();
  return enqueueManyAutomationJobs(
    tenantIds.map((tenantId) => ({
      name: "follow-up-reminder",
      payload: {
        tenantId,
        operationId: `follow-up-reminder-${tenantId}-${date}`,
        idempotencyKey: `follow-up-reminder:${tenantId}:${date}`,
        requestedAt: new Date().toISOString(),
        source: "scheduler",
        date,
      },
    }))
  );
}

export async function scheduleDeadlineAlertSweep() {
  const date = todayKey();
  const tenantIds = await activeTenantIds();
  return enqueueManyAutomationJobs(
    tenantIds.map((tenantId) => ({
      name: "deadline-alert",
      payload: {
        tenantId,
        operationId: `deadline-alert-${tenantId}-${date}`,
        idempotencyKey: `deadline-alert:${tenantId}:${date}`,
        requestedAt: new Date().toISOString(),
        source: "scheduler",
        date,
      },
    }))
  );
}

export async function scheduleLifecycleMonitoringSweep() {
  const date = todayKey();
  const tenantIds = await activeTenantIds();
  return enqueueManyAutomationJobs(
    tenantIds.map((tenantId) => ({
      name: "lifecycle-monitoring",
      payload: {
        tenantId,
        operationId: `lifecycle-monitoring-${tenantId}-${date}`,
        idempotencyKey: `lifecycle-monitoring:${tenantId}:${date}`,
        requestedAt: new Date().toISOString(),
        source: "scheduler",
        date,
      },
    }))
  );
}

export async function scheduleNetworkFollowUpSweep() {
  const date = todayKey();
  const tenantIds = await activeTenantIds();
  return enqueueManyAutomationJobs(
    tenantIds.map((tenantId) => ({
      name: "network-follow-up",
      payload: {
        tenantId,
        operationId: `network-follow-up-${tenantId}-${date}`,
        idempotencyKey: `network-follow-up:${tenantId}:${date}`,
        requestedAt: new Date().toISOString(),
        source: "scheduler",
        date,
      },
    }))
  );
}

export async function scheduleOfferTrackingSweep() {
  const date = todayKey();
  const tenantIds = await activeTenantIds();
  return enqueueManyAutomationJobs(
    tenantIds.map((tenantId) => ({
      name: "offer-tracking",
      payload: {
        tenantId,
        operationId: `offer-tracking-${tenantId}-${date}`,
        idempotencyKey: `offer-tracking:${tenantId}:${date}`,
        requestedAt: new Date().toISOString(),
        source: "scheduler",
        date,
      },
    }))
  );
}

export async function scheduleJobIntakeSweep() {
  const date = todayKey();
  const tenantIds = await activeTenantIds();
  const intakeIntervalMs = Number(process.env.GMAIL_INTAKE_INTERVAL_MS ?? 5 * 60_000);
  const intakeBucket = Math.floor(Date.now() / Math.max(60_000, intakeIntervalMs));
  return enqueueManyAutomationJobs(
    tenantIds.map((tenantId) => ({
      name: "job-intake",
      payload: {
        tenantId,
        operationId: `job-intake-${tenantId}-${date}-${Date.now()}`,
        idempotencyKey: `job-intake:${tenantId}:${date}:${intakeBucket}`,
        requestedAt: new Date().toISOString(),
        source: "scheduler",
      },
    }))
  );
}

/**
 * Auto-apply sweep: finds all jobs with status "Ready to Apply" that have a jobUrl
 * and queues a job-apply task for each. Skips jobs already in "Applying" state.
 * Only runs for tenants that have an active (non-expired) LinkedIn session.
 */
export async function scheduleAutoApplySweep() {
  const { isLinkedInCloudAutoApplyEnabled } = await import("@jobflow/shared/constants/linkedin-automation");
  if (!isLinkedInCloudAutoApplyEnabled()) return;

  const tenantIds = await activeTenantIds();
  const date = todayKey();

  for (const tenantId of tenantIds) {
    try {
      // Only queue if the tenant has an active LinkedIn session
      const sessionRow = await IntegrationConnectionModel.findOne({
        tenantId,
        provider: "playwright-session-linkedin",
        status: "Connected",
      }).lean() as Record<string, unknown> | null;
      if (!sessionRow) continue;
      const meta = (sessionRow?.metadata as Record<string, unknown>) ?? {};
      if (meta.sessionExpired === true) continue;

      // Find all Ready to Apply jobs with a URL
      const jobs = await JobModel.find({
        tenantId,
        status: "Ready to Apply",
        jobUrl: { $exists: true, $ne: "" },
      }).select("_id jobUrl generatedCoverLetterLink").lean() as Array<Record<string, unknown>>;

      for (const job of jobs) {
        const jobId = String(job._id);
        await enqueueAutomationJob({
          name: "job-apply",
          payload: {
            tenantId,
            jobId,
            jobUrl: String(job.jobUrl ?? ""),
            coverLetterUrl: String(job.generatedCoverLetterLink ?? ""),
            operationId: `auto-apply-${jobId}-${date}`,
            idempotencyKey: `auto-apply:${jobId}:${date}`,
            requestedAt: new Date().toISOString(),
            source: "scheduler",
          },
        });
      }
    } catch {
      // Non-fatal — skip this tenant
    }
  }
}

/**
 * Applied-status sweep: finds Application records still in "Applying" or recently
 * set to "Applied" without a corresponding applied-status run and queues them.
 * Catches jobs that moved to Applied via auto-apply but didn't fire the event.
 */
export async function scheduleAppliedStatusSweep() {
  const tenantIds = await activeTenantIds();
  const cutoff = new Date(Date.now() - 24 * 60 * 60_000); // last 24h

  for (const tenantId of tenantIds) {
    try {
      const { ApplicationModel } = await import("@jobflow/database/models");
      const apps = await ApplicationModel.find({
        tenantId,
        applicationStatus: "Applied",
        appliedAutomationStatus: "Completed",
        // Only process applications that were recently applied
        dateApplied: { $gte: cutoff },
      }).select("_id").lean() as Array<{ _id: unknown }>;

      for (const app of apps) {
        const appId = String(app._id);
        await enqueueAutomationJob({
          name: "applied-status",
          payload: {
            tenantId,
            applicationId: appId,
            operationId: `applied-status-sweep-${appId}`,
            idempotencyKey: `applied-status:${appId}:${todayKey()}`,
            requestedAt: new Date().toISOString(),
            source: "scheduler",
          },
        });
      }
    } catch {
      // Non-fatal — skip this tenant
    }
  }
}

/**
 * Keep LinkedIn sessions alive by visiting the feed with existing cookies every 12h.
 * Does NOT re-login (which gets blocked by LinkedIn's cloud-server IP detection).
 * Just opens a headless browser with the stored session and navigates to /feed so
 * LinkedIn sees activity and resets its session expiry clock.
 */
export async function scheduleLinkedInSessionKeepAlive() {
  const { isLinkedInCloudAutoApplyEnabled } = await import("@jobflow/shared/constants/linkedin-automation");
  if (!isLinkedInCloudAutoApplyEnabled()) return;

  const tenantIds = await activeTenantIds();
  for (const tenantId of tenantIds) {
    let session: Awaited<ReturnType<typeof launchBrowser>> | null = null;
    try {
      const storageState = await loadSession({ tenantId, platform: "linkedin" });
      if (!storageState) continue;

      const pinnedProxy = await loadPlaywrightProxyUrl({ tenantId, platform: "linkedin" });
      const proxyUrl = pinnedProxy ?? process.env.PROXY_URL ?? process.env.PLAYWRIGHT_PROXY_URL;
      session = await launchBrowser({ headless: true, storageState, proxyUrl });

      // Visit feed to signal activity to LinkedIn — this resets session expiry
      await session.page.goto("https://www.linkedin.com/feed/", {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await humanDelay(2000, 4000);

      const url = session.page.url();
      const title = await session.page.title().catch(() => "");
      const isAlive = !url.includes("/login") && !url.includes("/authwall") &&
        !/log in or sign up/i.test(title) && !/^https?:\/\/www\.linkedin\.com\/?(\?.*)?$/.test(url);

      if (isAlive) {
        // Save refreshed cookies back to DB
        const freshState = await session.context.storageState();
        await saveSession({
          tenantId,
          platform: "linkedin",
          storageState: freshState,
          clearSessionExpiredFlags: true,
        });
      }
    } catch {
      // Non-fatal — just skip this tenant
    } finally {
      await session?.close().catch(() => void 0);
    }
  }
}
