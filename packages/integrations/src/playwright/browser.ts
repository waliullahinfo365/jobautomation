/**
 * Playwright browser factory.
 *
 * - headless=false + no storageState → one-time manual login (CLI)
 * - headless=true + storageState    → automated apply (worker)
 *
 * Uses chromium. Railway workers need: RUN npx playwright install chromium --with-deps
 * in the Dockerfile (see apps/workers/Dockerfile).
 */

import type { Browser, BrowserContext, Page } from "playwright";
import type { ApplyPlatform } from "./session-store";

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  close: () => Promise<void>;
}

export async function launchBrowser(options: {
  headless: boolean;
  storageState?: object;
  slowMo?: number;
}): Promise<BrowserSession> {
  const { chromium } = await import("playwright");

  const browser = await chromium.launch({
    headless: options.headless,
    slowMo: options.slowMo ?? (options.headless ? 0 : 80),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-infobars",
    ],
  });

  const contextOptions: Record<string, unknown> = {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
    timezoneId: "Europe/Berlin",
  };

  if (options.storageState) {
    contextOptions.storageState = options.storageState;
  }

  const context = await browser.newContext(contextOptions as Parameters<Browser["newContext"]>[0]);

  // Hide automation fingerprint
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const page = await context.newPage();

  return {
    browser,
    context,
    page,
    close: async () => {
      await context.close().catch(() => void 0);
      await browser.close().catch(() => void 0);
    },
  };
}

/** Detect which platform a job URL belongs to */
export function detectPlatform(url: string): ApplyPlatform {
  const u = url.toLowerCase();
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("indeed.com")) return "indeed";
  if (u.includes("greenhouse.io") || u.includes("boards.greenhouse")) return "greenhouse";
  if (u.includes("lever.co")) return "lever";
  if (u.includes("workday.com") || u.includes("myworkdayjobs.com")) return "workday";
  return "generic";
}

/** Human-like delay to avoid bot detection */
export async function humanDelay(minMs = 500, maxMs = 1500): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs) + minMs);
  await new Promise((r) => setTimeout(r, ms));
}

/** Type text with human-like speed */
export async function humanType(page: Page, selector: string, text: string): Promise<void> {
  await page.click(selector);
  await page.fill(selector, "");
  await humanDelay(100, 300);
  await page.type(selector, text, { delay: Math.floor(Math.random() * 60 + 40) });
}
