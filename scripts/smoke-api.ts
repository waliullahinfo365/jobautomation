/**
 * Lightweight API smoke test — no external providers required.
 * - Local: uses x-tenant-id / x-user-id when ALLOW_DEV_AUTH_HEADERS is true (same as web mock fallback).
 * - Production: set SMOKE_AUTH_TOKEN (or JOBFLOW_ACCESS_TOKEN) to a JWT from login/register; dev headers are ignored if the API rejects them.
 */
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TENANT = process.env.DEMO_TENANT_ID ?? process.env.NEXT_PUBLIC_DEMO_TENANT_ID ?? "demo-tenant-id";
const USER = process.env.DEMO_USER_ID ?? process.env.NEXT_PUBLIC_DEMO_USER_ID ?? "demo-user-id";
const AUTH_TOKEN = process.env.SMOKE_AUTH_TOKEN ?? process.env.JOBFLOW_ACCESS_TOKEN ?? "";

type Result = { name: string; ok: boolean; detail?: string };

function authHeaders(): Record<string, string> {
  if (AUTH_TOKEN) {
    return { Authorization: `Bearer ${AUTH_TOKEN}`, "Content-Type": "application/json" };
  }
  return {
    "Content-Type": "application/json",
    "x-tenant-id": TENANT,
    "x-user-id": USER,
    "x-user-role": "Owner",
  };
}

async function get(path: string): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
}

async function post(path: string, body: unknown = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

function unwrap(json: unknown): unknown {
  if (typeof json === "object" && json !== null && "success" in json && (json as { success?: boolean }).success === true && "data" in json) {
    return (json as { data: unknown }).data;
  }
  return json;
}

async function main() {
  const results: Result[] = [];

  async function run(name: string, fn: () => Promise<boolean>) {
    try {
      const ok = await fn();
      results.push({ name, ok });
    } catch (e) {
      results.push({ name, ok: false, detail: e instanceof Error ? e.message : String(e) });
    }
  }

  await run("GET /health", async () => {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    return res.ok;
  });

  await run("GET /billing/plan", async () => {
    const res = await get("/billing/plan");
    const json = await res.json();
    return res.ok && (json as { success?: boolean }).success === true;
  });

  await run("POST /jobs/intake-test", async () => {
    const res = await post("/jobs/intake-test", {
      from: "smoke@jobflow.local",
      subject: "Smoke intake",
      bodyText: "Smoke test body for intake.",
    });
    const json = await res.json();
    return res.ok && (json as { success?: boolean }).success === true;
  });

  await run("GET /automation/logs", async () => {
    const res = await get("/automation/logs?limit=5");
    const json = await res.json();
    const data = unwrap(await Promise.resolve(json));
    return res.ok && Array.isArray(data);
  });

  await run("POST /reports/daily-digest/run", async () => {
    const res = await post("/reports/daily-digest/run", {});
    const json = await res.json();
    return res.ok && (json as { success?: boolean }).success === true;
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`\nSmoke API — ${passed}/${results.length} passed (API_URL=${API_URL})\n`);
  for (const r of results) {
    const icon = r.ok ? "✓" : "✗";
    console.log(`${icon} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  if (failed.length) {
    console.error("\nSome checks failed. Ensure MongoDB is running and the API is up.");
    process.exit(1);
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
