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

  const proxyUrl = process.env.PROXY_URL ?? process.env.PLAYWRIGHT_PROXY_URL;
  if (proxyUrl) {
    try {
      const u = new URL(proxyUrl);
      console.info(`[workers env] Residential proxy configured: ${u.protocol}//${u.hostname}:${u.port} (auth: ${u.username ? "yes" : "no"})`);
    } catch {
      warn("PROXY_URL is set but could not be parsed as a valid URL — Playwright will use direct connection");
    }
  } else {
    warn("PROXY_URL not set — Playwright will use the server's IP directly (LinkedIn sessions may expire quickly)");
  }
}
