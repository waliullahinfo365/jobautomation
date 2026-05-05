function warn(msg: string): void {
  console.warn(`[workers env] ${msg}`);
}

function failMissingEnv(key: string): never {
  throw new Error(`Missing required worker env: ${key}`);
}

export function validateWorkerEnv(): void {
  const required = [
    ["NODE_ENV", process.env.NODE_ENV],
    ["QUEUE_MODE", process.env.QUEUE_MODE],
    ["MONGODB_URI", process.env.MONGODB_URI],
    ["JWT_SECRET", process.env.JWT_SECRET],
    ["ENCRYPTION_KEY", process.env.ENCRYPTION_KEY],
  ] as const;

  for (const [key, val] of required) {
    if (!val || String(val).trim() === "") {
      failMissingEnv(key);
    }
  }

  const mode = process.env.QUEUE_MODE!;
  if (mode === "bullmq" && !process.env.REDIS_URL) {
    failMissingEnv("REDIS_URL");
  }

  if (process.env.NODE_ENV === "production" && mode === "memory") {
    warn(
      "QUEUE_MODE is memory in production — jobs are not durable across restarts. Use Redis + bullmq for production queues.",
    );
  }
}
