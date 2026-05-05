import { randomUUID } from "node:crypto";
import { AutomationLogModel } from "@jobflow/database/models";
import type { AutomationJobName, AutomationJobPayload, AutomationQueueResult, EnqueueAutomationJobInput } from "@jobflow/shared/types/queue";
import { dispatchAutomationJob } from "../processors/automation.dispatcher";
import { AUTOMATION_QUEUE_NAME } from "./constants";

type QueueMode = "memory" | "bullmq" | "disabled";

const memoryQueue: Array<{ id: string; name: AutomationJobName; payload: AutomationJobPayload }> = [];
const idempotencyMap = new Map<string, { jobId: string; operationId: string; timestamp: number }>();
const IDEMPOTENCY_WINDOW_MS = 15 * 60 * 1000;

let bullQueue: { add: (name: string, payload: unknown, options?: Record<string, unknown>) => Promise<{ id?: string }> } | null = null;
let resolvedQueueMode: QueueMode | null = null;

async function resolveBullQueue() {
  if (!process.env.REDIS_URL) return null;
  try {
    const dynamicImport = new Function("p", "return import(p)") as (path: string) => Promise<any>;
    const bullmq = await dynamicImport("bullmq");
    const ioredis = await dynamicImport("ioredis");
    const connection = new ioredis.default(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    const queue = new bullmq.Queue(AUTOMATION_QUEUE_NAME, { connection });
    return queue;
  } catch {
    return null;
  }
}

export function getQueueMode(): QueueMode {
  if (process.env.QUEUE_MODE === "disabled") return "disabled";
  if (resolvedQueueMode) return resolvedQueueMode;
  return process.env.REDIS_URL ? "bullmq" : "memory";
}

async function ensureQueueMode(): Promise<QueueMode> {
  const requestedMode = process.env.QUEUE_MODE;
  if (process.env.QUEUE_MODE === "disabled") {
    resolvedQueueMode = "disabled";
    return resolvedQueueMode;
  }
  if (bullQueue || resolvedQueueMode === "bullmq") return "bullmq";
  if (requestedMode === "bullmq" && !process.env.REDIS_URL) {
    throw new Error("QUEUE_MODE is set to bullmq but REDIS_URL is missing");
  }
  if (process.env.REDIS_URL) {
    bullQueue = await resolveBullQueue();
    if (requestedMode === "bullmq" && !bullQueue) {
      throw new Error("QUEUE_MODE is bullmq but BullMQ queue initialization failed");
    }
    resolvedQueueMode = bullQueue ? "bullmq" : "memory";
    return resolvedQueueMode;
  }
  if (requestedMode === "bullmq") {
    throw new Error("QUEUE_MODE is bullmq but REDIS_URL is not configured");
  }
  resolvedQueueMode = "memory";
  return resolvedQueueMode;
}

function shouldInlineExecute() {
  return process.env.QUEUE_INLINE_EXECUTION === "true";
}

function getIdempotencyMatch(idempotencyKey?: string) {
  if (!idempotencyKey) return null;
  const existing = idempotencyMap.get(idempotencyKey);
  if (!existing) return null;
  if (Date.now() - existing.timestamp > IDEMPOTENCY_WINDOW_MS) {
    idempotencyMap.delete(idempotencyKey);
    return null;
  }
  return existing;
}

async function createQueueLog(input: {
  tenantId: string;
  moduleKey: string;
  operationId: string;
  idempotencyKey?: string;
  queueMode: QueueMode;
  source: string;
  payloadSummary: Record<string, unknown>;
}) {
  await AutomationLogModel.create({
    tenantId: input.tenantId,
    createdBy: "system",
    moduleKey: input.moduleKey,
    moduleName: input.moduleKey,
    status: "Running",
    message: "Automation job queued",
    operationId: input.operationId,
    idempotencyKey: input.idempotencyKey,
    metadata: { queueMode: input.queueMode, source: input.source, payloadSummary: input.payloadSummary },
  });
}

export async function enqueueAutomationJob(input: EnqueueAutomationJobInput): Promise<AutomationQueueResult> {
  const mode = await ensureQueueMode();
  const operationId = input.payload.operationId || randomUUID();
  const jobId = randomUUID();
  const idempotencyKey = input.payload.idempotencyKey;
  const duplicate = getIdempotencyMatch(idempotencyKey);

  if (duplicate) {
    return {
      operationId: duplicate.operationId,
      jobId: duplicate.jobId,
      name: input.name,
      status: "skipped",
      message: "Skipped: matching idempotency key already queued recently",
    };
  }

  if (mode === "disabled") {
    return { operationId, jobId, name: input.name, status: "skipped", message: "Queue mode disabled" };
  }

  await createQueueLog({
    tenantId: input.payload.tenantId,
    moduleKey: input.name,
    operationId,
    idempotencyKey,
    queueMode: mode,
    source: input.payload.source,
    payloadSummary: {
      requestedAt: input.payload.requestedAt,
      delayMs: input.delayMs,
      priority: input.priority,
      attempts: input.attempts,
    },
  });

  if (mode === "bullmq" && bullQueue) {
    const job = await bullQueue.add(input.name, input.payload, {
      delay: input.delayMs ?? 0,
      attempts: input.attempts ?? 3,
      priority: input.priority ?? 5,
      jobId: idempotencyKey || undefined,
      removeOnComplete: 100,
      removeOnFail: 100,
    });
    if (idempotencyKey) idempotencyMap.set(idempotencyKey, { jobId: String(job.id ?? jobId), operationId, timestamp: Date.now() });
    return {
      operationId,
      jobId: String(job.id ?? jobId),
      name: input.name,
      status: input.delayMs ? "scheduled" : "queued",
      message: "Job queued in BullMQ mode",
    };
  }

  memoryQueue.push({ id: jobId, name: input.name, payload: { ...input.payload, operationId } });
  if (idempotencyKey) idempotencyMap.set(idempotencyKey, { jobId, operationId, timestamp: Date.now() });

  if (shouldInlineExecute()) {
    await dispatchAutomationJob(input.name, { ...input.payload, operationId });
  }

  return {
    operationId,
    jobId,
    name: input.name,
    status: input.delayMs ? "scheduled" : "queued",
    message: "Job queued in memory mode (non-durable)",
  };
}

export async function enqueueManyAutomationJobs(inputs: EnqueueAutomationJobInput[]): Promise<AutomationQueueResult[]> {
  const results: AutomationQueueResult[] = [];
  for (const input of inputs) {
    results.push(await enqueueAutomationJob(input));
  }
  return results;
}

export async function drainMemoryQueue() {
  while (memoryQueue.length > 0) {
    const item = memoryQueue.shift();
    if (!item) continue;
    await dispatchAutomationJob(item.name, item.payload);
  }
}
