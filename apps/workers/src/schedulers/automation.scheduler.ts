import { TenantModel } from "@jobflow/database/models";
import type { EnqueueAutomationJobInput } from "@jobflow/shared/types/queue";
import { enqueueManyAutomationJobs } from "../queues/automation.queue";

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
