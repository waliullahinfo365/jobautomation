#!/usr/bin/env node
/**
 * NewJob Guru Desktop Apply Agent
 *
 * Usage:
 *   pnpm start pair --code 123456 --api-url https://api.newjob.guru
 *   pnpm start run --api-url https://api.newjob.guru
 *   pnpm start login linkedin
 *
 * Stores agent token + LinkedIn profile under ~/.newjobguru/
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { runApply } from "@jobflow/integrations/playwright";
import type { UserProfile } from "@jobflow/integrations/playwright";
import { launchBrowser } from "@jobflow/integrations/playwright/browser";

const CONFIG_DIR = join(homedir(), ".newjobguru");
const CONFIG_FILE = join(CONFIG_DIR, "agent-config.json");

type AgentConfig = {
  apiUrl: string;
  token: string;
  tenantId?: string;
};

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
}

function loadConfig(): AgentConfig | null {
  if (!existsSync(CONFIG_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as AgentConfig;
  } catch {
    return null;
  }
}

function saveConfig(config: AgentConfig) {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}

function parseArgs(argv: string[]) {
  const args = [...argv];
  const command = args.shift() ?? "help";
  const flags: Record<string, string> = {};
  while (args.length >= 2 && args[0].startsWith("--")) {
    flags[args[0].slice(2)] = args[1];
    args.splice(0, 2);
  }
  return { command, flags, rest: args };
}

async function apiFetch(config: AgentConfig, path: string, init?: RequestInit) {
  const url = `${config.apiUrl.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json().catch(() => ({}))) as { data?: unknown; message?: string };
  if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
  return json.data ?? json;
}

async function cmdPair(flags: Record<string, string>) {
  const code = flags.code?.trim();
  const apiUrl = flags["api-url"]?.trim() ?? "http://localhost:4000";
  if (!code) throw new Error("--code is required (6 digits from Settings)");

  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/agent/pair`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, deviceName: flags["device-name"] ?? "Desktop Apply Agent", agentVersion: "0.1.0" }),
  });
  const json = (await res.json()) as { data?: { token?: string; tenantId?: string }; message?: string };
  if (!res.ok) throw new Error(json.message ?? `Pair failed (${res.status})`);

  const token = json.data?.token;
  const tenantId = json.data?.tenantId;
  if (!token) throw new Error("No token returned");

  saveConfig({ apiUrl, token, tenantId });
  console.log("✓ Agent paired successfully. Token saved to", CONFIG_FILE);
}

async function cmdLoginLinkedIn() {
  ensureConfigDir();
  console.log("Opening LinkedIn login — complete login in the browser window…");
  const session = await launchBrowser({ headless: false, slowMo: 80 });
  try {
    await session.page.goto("https://www.linkedin.com/login", { waitUntil: "domcontentloaded" });
    console.log("Log in, then press Enter here when you see your LinkedIn feed…");
    await new Promise<void>((resolve) => {
      process.stdin.resume();
      process.stdin.once("data", () => resolve());
    });
    const storageState = await session.context.storageState();
    writeFileSync(join(CONFIG_DIR, "linkedin-session.json"), JSON.stringify(storageState, null, 2), "utf8");
    console.log("✓ LinkedIn session saved to", join(CONFIG_DIR, "linkedin-session.json"));
  } finally {
    await session.close();
  }
}

async function cmdRun(flags: Record<string, string>) {
  const config = loadConfig();
  if (!config?.token) throw new Error("Not paired — run: pnpm start pair --code XXXXXX --api-url ...");

  if (flags["api-url"]) config.apiUrl = flags["api-url"];

  const sessionPath = join(CONFIG_DIR, "linkedin-session.json");
  if (!existsSync(sessionPath)) {
    throw new Error("No LinkedIn session — run: pnpm start login linkedin");
  }

  const storageState = JSON.parse(readFileSync(sessionPath, "utf8")) as object;
  const intervalMs = Number(flags.interval ?? 120_000);

  console.log(`Apply Agent running — polling every ${intervalMs / 1000}s`);

  const tick = async () => {
    try {
      await apiFetch(config, "/agent/heartbeat", {
        method: "POST",
        body: JSON.stringify({ agentVersion: "0.1.0", linkedInConnected: true }),
      });

      const profile = (await apiFetch(config, "/agent/profile")) as UserProfile;

      const queue = (await apiFetch(config, "/agent/apply-queue")) as {
        jobs?: Array<{ jobId: string; jobUrl: string; company: string; position: string; coverLetterUrl?: string }>;
      };

      const jobs = queue.jobs ?? [];
      if (jobs.length === 0) {
        console.log("[agent] no jobs ready");
        return;
      }

      for (const job of jobs.slice(0, 1)) {
        console.log(`[agent] applying: ${job.position} @ ${job.company}`);
        const result = await runApply({
          tenantId: config.tenantId ?? "agent-local",
          jobId: job.jobId,
          jobUrl: job.jobUrl,
          platform: "linkedin",
          profile,
          company: job.company,
          position: job.position,
          coverLetterUrl: job.coverLetterUrl,
          storageState,
          headless: false,
          skipSessionPersist: true,
          dryRun: false,
        });

        await apiFetch(config, "/agent/apply-result", {
          method: "POST",
          body: JSON.stringify({
            jobId: job.jobId,
            success: result.success,
            message: result.message,
            stepsCompleted: result.stepsCompleted,
          }),
        });

        console.log(result.success ? "✓ Applied" : `✗ Failed: ${result.message}`);

        if (result.storageState && !result.sessionExpired) {
          writeFileSync(sessionPath, JSON.stringify(result.storageState, null, 2), "utf8");
        }
      }
    } catch (err) {
      console.error("[agent] error:", err instanceof Error ? err.message : String(err));
    }
  };

  await tick();
  setInterval(() => void tick(), intervalMs);
}

async function main() {
  const { command, flags, rest } = parseArgs(process.argv.slice(2));

  if (command === "pair") return cmdPair(flags);
  if (command === "login" && rest[0] === "linkedin") return cmdLoginLinkedIn();
  if (command === "run") return cmdRun(flags);

  console.log(`
NewJob Guru Apply Agent

  pair --code 123456 --api-url https://api.newjob.guru
  login linkedin
  run [--interval 120000]
`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
