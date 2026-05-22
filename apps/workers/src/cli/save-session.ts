#!/usr/bin/env tsx
/**
 * One-time login CLI — saves browser session to MongoDB.
 *
 * Usage (run locally, NOT on Railway):
 *   pnpm save-session linkedin
 *   pnpm save-session indeed
 *   pnpm save-session greenhouse
 *
 * What it does:
 * 1. Opens a VISIBLE Chrome window
 * 2. Navigates to the platform login page
 * 3. Waits for you to log in manually (2-factor auth, CAPTCHA — all handled by you)
 * 4. Once you press ENTER in the terminal, saves the session cookies to MongoDB
 * 5. Future headless runs will use these cookies automatically
 *
 * Session is stored encrypted in MongoDB and persists across Railway deploys.
 *
 * Requirements:
 * - MONGODB_URI env var (same as production, or your local .env)
 * - PLAYWRIGHT must be installed: pnpm exec playwright install chromium
 */

import { connectDatabase, disconnectDatabase } from "@jobflow/database";
import { launchBrowser } from "@jobflow/integrations/playwright";
import { saveSession, deleteSession } from "@jobflow/integrations/playwright";
import type { ApplyPlatform } from "@jobflow/integrations/playwright";
import * as readline from "readline";

const LOGIN_URLS: Record<ApplyPlatform, string> = {
  linkedin: "https://www.linkedin.com/login",
  indeed: "https://secure.indeed.com/auth?hl=en&co=US&continue=https%3A%2F%2Fwww.indeed.com%2F",
  greenhouse: "https://app.greenhouse.io/users/sign_in",
  lever: "https://hire.lever.co/signin",
  workday: "https://www.myworkdayjobs.com/en-US/External",
  generic: "about:blank",
};

const LOGGED_IN_INDICATORS: Record<ApplyPlatform, string> = {
  linkedin: "linkedin.com/feed",
  indeed: "indeed.com/",
  greenhouse: "app.greenhouse.io/dashboard",
  lever: "hire.lever.co",
  workday: "myworkdayjobs.com",
  generic: "",
};

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function main() {
  const platform = (process.argv[2] ?? "linkedin") as ApplyPlatform;
  const validPlatforms: ApplyPlatform[] = ["linkedin", "indeed", "greenhouse", "lever", "workday", "generic"];
  if (!validPlatforms.includes(platform)) {
    console.error(`❌  Unknown platform: ${platform}`);
    console.error(`    Valid options: ${validPlatforms.join(", ")}`);
    process.exit(1);
  }

  // Get tenantId from env or prompt
  const tenantId = process.env.TENANT_ID ?? (await prompt("Enter your tenant ID (from MongoDB): ")).trim();
  if (!tenantId) {
    console.error("❌  TENANT_ID is required");
    process.exit(1);
  }

  console.log(`\n🚀 Launching Chrome for ${platform} login...`);
  console.log("   A browser window will open. Log in manually, then come back here.");

  // If PROXY_URL is set, use the same proxy that the Railway worker uses.
  // This is critical: LinkedIn binds session cookies to the IP that logged in.
  // If you log in without proxy and the worker uses a proxy, the session will
  // be rejected immediately. Always use the same proxy here as in production.
  const proxyUrl = process.env.PROXY_URL?.trim();
  if (proxyUrl) {
    console.log(`\n   Proxy detected: ${proxyUrl.replace(/:\/\/[^@]+@/, "://<credentials>@")}`);
    console.log("   The browser will log in through the proxy — same IP the worker will use.");
  } else {
    console.log("\n⚠️  No PROXY_URL set — session will be bound to your local IP.");
    console.log("   If Railway uses a different IP, the session will expire immediately.");
    console.log("   Set PROXY_URL in your .env to match production before running this.");
  }

  await connectDatabase();

  const session = await launchBrowser({ headless: false, slowMo: 50, proxyUrl });

  try {
    const loginUrl = LOGIN_URLS[platform];
    await session.page.goto(loginUrl, { waitUntil: "domcontentloaded" });

    console.log(`\n✋ Please log in to ${platform} in the browser window.`);
    console.log("   Complete any 2FA, CAPTCHA, or security challenges as needed.");
    console.log("   When you are fully logged in, come back here and press ENTER.\n");

    await prompt("Press ENTER once you are logged in > ");

    // Verify they actually logged in
    const currentUrl = session.page.url();
    const indicator = LOGGED_IN_INDICATORS[platform];
    const loggedIn = !indicator || currentUrl.includes(indicator) ||
      !currentUrl.includes("login") && !currentUrl.includes("signin") && !currentUrl.includes("auth");

    if (!loggedIn) {
      const confirm = await prompt(`⚠️  URL doesn't look like a logged-in state (${currentUrl}). Save anyway? [y/N] > `);
      if (!confirm.toLowerCase().startsWith("y")) {
        console.log("❌  Aborted — session not saved.");
        await session.close();
        await disconnectDatabase();
        process.exit(0);
      }
    }

    // Save session
    await saveSession({
      tenantId,
      platform,
      storageState: await session.context.storageState(),
    });

    console.log(`\n✅ Session saved for ${platform} (tenant: ${tenantId})`);
    console.log("   The worker will now use this session automatically.");
    console.log("   Re-run this command if you get 'session expired' errors.\n");

  } catch (err) {
    console.error("❌  Error saving session:", err);
    await session.close();
    await disconnectDatabase();
    process.exit(1);
  }

  await session.close();
  await disconnectDatabase();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
