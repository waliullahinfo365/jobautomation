export type ApiQueueMode = "memory" | "bullmq" | "disabled";

export function getApiQueueReport(): { mode: ApiQueueMode } {
  if (process.env.QUEUE_MODE === "disabled") return { mode: "disabled" };
  if (process.env.REDIS_URL) return { mode: "bullmq" };
  return { mode: "memory" };
}
