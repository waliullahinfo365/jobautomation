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
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--window-size=1366,768",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-default-apps",
      "--mute-audio",
      "--lang=en-US",
    ],
  });

  // Randomise viewport slightly to avoid fingerprint clustering
  const w = 1280 + Math.floor(Math.random() * 120);
  const h = 768 + Math.floor(Math.random() * 80);

  const contextOptions: Record<string, unknown> = {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: w, height: h },
    locale: "en-US",
    timezoneId: "America/New_York",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
    },
  };

  if (options.storageState) {
    contextOptions.storageState = options.storageState;
  }

  const context = await browser.newContext(contextOptions as Parameters<Browser["newContext"]>[0]);

  // Full stealth: hide all automation signals
  await context.addInitScript(() => {
    // webdriver flag
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    // plugins array (headless Chrome has 0)
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    // languages
    Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
    // chrome object expected by sites
    // @ts-expect-error runtime injection
    window.chrome = { runtime: {} };
    // permissions API — headless returns "denied" for notifications; override to look normal
    const originalQuery = window.navigator.permissions?.query?.bind(window.navigator.permissions);
    if (originalQuery) {
      window.navigator.permissions.query = (parameters: PermissionDescriptor) =>
        (parameters.name as string) === "notifications"
          ? Promise.resolve({ state: "prompt" } as PermissionStatus)
          : originalQuery(parameters);
    }
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
