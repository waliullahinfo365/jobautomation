function shouldValidate(): boolean {
  return process.env.NODE_ENV === "production" || process.env.FORCE_ENV_VALIDATION === "true";
}

function warn(msg: string): void {
  console.warn(`[workers env] ${msg}`);
}

function fail(msg: string): never {
  throw new Error(`[workers env] ${msg}`);
}

export function validateWorkerEnv(): void {
  if (!shouldValidate()) return;

  const required = [
    ["MONGODB_URI", process.env.MONGODB_URI],
    ["JWT_SECRET", process.env.JWT_SECRET],
    ["ENCRYPTION_KEY", process.env.ENCRYPTION_KEY],
  ] as const;

  for (const [key, val] of required) {
    if (!val || String(val).trim() === "") {
      fail(`Missing required environment variable: ${key}`);
    }
  }

  const mode = process.env.QUEUE_MODE ?? "memory";
  if (mode === "bullmq" && !process.env.REDIS_URL) {
    fail("QUEUE_MODE is bullmq but REDIS_URL is not set");
  }

  if (process.env.NODE_ENV === "production" && mode === "memory") {
    warn(
      "QUEUE_MODE is memory in production — jobs are not durable across restarts. Use Redis + bullmq for production queues.",
    );
  }
}
