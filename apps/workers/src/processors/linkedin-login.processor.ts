import { IntegrationConnectionModel } from "@jobflow/database/models";
import { saveSession, loadPlaywrightProxyUrl } from "@jobflow/integrations/playwright/session-store";
import { launchBrowser, humanDelay } from "@jobflow/integrations/playwright/browser";
import type { LinkedInLoginPayload } from "@jobflow/shared/types/queue";
import { encryptSecretForWorker, decryptSecretForWorker } from "../lib/google-auth";
import { logger } from "../utils/logger";

/** Load stored LinkedIn credentials for this tenant (for auto-re-login) */
export async function loadLinkedInCredentials(tenantId: string): Promise<{ email: string; password: string } | null> {
  const row = await IntegrationConnectionModel.findOne({
    tenantId,
    provider: "playwright-session-linkedin",
  }).lean() as Record<string, unknown> | null;
  if (!row) return null;
  const meta = (row.metadata as Record<string, unknown>) ?? {};
  const emailEnc = meta.emailEncrypted as string | undefined;
  const passEnc = meta.passwordEncrypted as string | undefined;
  if (!emailEnc || !passEnc) return null;
  try {
    return { email: decryptSecretForWorker(emailEnc), password: decryptSecretForWorker(passEnc) };
  } catch {
    return null;
  }
}

const LOGIN_URL = "https://www.linkedin.com/login";
const TIMEOUT = 45_000;

/** Write login attempt result back to MongoDB so the UI can poll it immediately */
async function writeLoginResult(tenantId: string, status: "pending" | "connected" | "failed", message: string) {
  await IntegrationConnectionModel.findOneAndUpdate(
    { tenantId, provider: "playwright-session-linkedin-attempt" },
    {
      tenantId,
      provider: "playwright-session-linkedin-attempt",
      status: status === "connected" ? "Connected" : status === "pending" ? "Needs Attention" : "Disabled",
      syncStatus: status,
      errorMessage: status === "failed" ? message : undefined,
      lastSyncAt: new Date(),
      metadata: { message, updatedAt: new Date().toISOString() },
    },
    { upsert: true, new: true }
  );
}

export async function processLinkedInLogin(payload: LinkedInLoginPayload): Promise<{
  success: boolean;
  message: string;
}> {
  logger.info({ tenantId: payload.tenantId }, "Starting LinkedIn credential login");

  await writeLoginResult(payload.tenantId, "pending", "Login in progress…");

  const pinnedProxy = await loadPlaywrightProxyUrl({ tenantId: payload.tenantId, platform: "linkedin" });
  const proxyUrl = pinnedProxy ?? process.env.PROXY_URL ?? process.env.PLAYWRIGHT_PROXY_URL;
  const session = await launchBrowser({ headless: true, ...(proxyUrl ? { proxyUrl } : {}) });
  const { page, context } = session;

  try {
    // Navigate to login page
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: TIMEOUT });
    await humanDelay(1500, 2500);

    // Check page loaded correctly
    const pageUrl = page.url();
    if (!pageUrl.includes("linkedin.com")) {
      throw new Error(`Unexpected redirect to: ${pageUrl}`);
    }

    // Wait for email field and fill it slowly
    await page.waitForSelector("#username", { timeout: 15_000 });
    await humanDelay(800, 1500);
    await page.click("#username");
    await humanDelay(300, 600);
    await page.type("#username", payload.email, { delay: 80 + Math.random() * 60 });

    await humanDelay(600, 1200);

    // Fill password
    await page.click("#password");
    await humanDelay(400, 800);
    await page.type("#password", payload.password, { delay: 70 + Math.random() * 50 });

    await humanDelay(1000, 2000);

    // Click sign in
    const submitBtn = page.locator('[data-litms-control-urn="login-submit"], button[type="submit"]').first();
    await submitBtn.click();

    // Wait for navigation — LinkedIn may take several seconds
    try {
      await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: TIMEOUT });
    } catch {
      // navigation timeout is acceptable — page may just be loading slowly
    }

    await humanDelay(2000, 3000);

    const currentUrl = page.url();
    logger.info({ tenantId: payload.tenantId, currentUrl }, "Post-login URL");

    // --- Detect failure states ---

    // Wrong password / account error
    const errorVisible = await page
      .locator('#error-for-password, .alert-content, [data-test-id="alert-bar-text"], .login__form_error_container')
      .first()
      .isVisible()
      .catch(() => false);
    if (errorVisible) {
      const errorText = await page
        .locator('#error-for-password, .alert-content, [data-test-id="alert-bar-text"], .login__form_error_container')
        .first()
        .textContent()
        .catch(() => "");
      await session.close();
      const msg = `Wrong email or password. LinkedIn says: "${errorText?.trim() ?? "Incorrect credentials"}"`;
      await writeLoginResult(payload.tenantId, "failed", msg);
      return { success: false, message: msg };
    }

    // CAPTCHA / security checkpoint
    if (
      currentUrl.includes("/checkpoint") ||
      currentUrl.includes("/challenge") ||
      currentUrl.includes("/uas/") ||
      currentUrl.includes("security-verification") ||
      currentUrl.includes("feed/security")
    ) {
      await session.close();
      const msg =
        "LinkedIn is showing a security verification challenge. This usually happens when logging in from a new location (cloud server). " +
        "Please try: (1) logging into LinkedIn from your phone/browser first to mark this device as trusted, then retry here, " +
        "or (2) temporarily connect via a VPN on the same IP as your normal login location.";
      await writeLoginResult(payload.tenantId, "failed", msg);
      return { success: false, message: msg };
    }

    // Still on login page — login didn't proceed
    if (currentUrl.includes("/login")) {
      // Take a screenshot hint from page title
      const title = await page.title().catch(() => "");
      await session.close();
      const msg = `Login page did not advance (page: "${title}", url: ${currentUrl}). LinkedIn may be blocking automated login from this server IP. Try again or use a different network.`;
      await writeLoginResult(payload.tenantId, "failed", msg);
      return { success: false, message: msg };
    }

    // --- Confirm successful login ---
    const loggedIn =
      currentUrl.includes("/feed") ||
      currentUrl.includes("/home") ||
      currentUrl.includes("/mynetwork") ||
      currentUrl.includes("/jobs") ||
      currentUrl === "https://www.linkedin.com/" ||
      currentUrl.startsWith("https://www.linkedin.com/?");

    if (!loggedIn) {
      // Navigate to feed to confirm session
      await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded", timeout: TIMEOUT });
      await humanDelay(2000, 3000);
      const afterUrl = page.url();

      if (afterUrl.includes("/login") || afterUrl.includes("/checkpoint")) {
        await session.close();
        const msg = `Session not established — redirected back to ${afterUrl}. LinkedIn may have blocked the login.`;
        await writeLoginResult(payload.tenantId, "failed", msg);
        return { success: false, message: msg };
      }
    }

    // Save session cookies + localStorage to MongoDB
    const storageState = await context.storageState();
    const effectiveProxy = proxyUrl;
    await saveSession({
      tenantId: payload.tenantId,
      platform: "linkedin",
      storageState,
      proxyPin: effectiveProxy ? { mode: "set", url: effectiveProxy } : { mode: "keep" },
      clearSessionExpiredFlags: true,
    });

    // Persist encrypted credentials so the worker can auto-re-login when the session expires
    try {
      await IntegrationConnectionModel.updateOne(
        { tenantId: payload.tenantId, provider: "playwright-session-linkedin" },
        {
          $set: {
            "metadata.emailEncrypted": encryptSecretForWorker(payload.email),
            "metadata.passwordEncrypted": encryptSecretForWorker(payload.password),
          },
        }
      );
    } catch (credErr) {
      logger.warn({ tenantId: payload.tenantId, err: String(credErr) }, "Failed to persist LinkedIn credentials — auto-relogin disabled");
    }

    await writeLoginResult(payload.tenantId, "connected", "LinkedIn session connected successfully.");

    await session.close();
    logger.info({ tenantId: payload.tenantId }, "LinkedIn session saved successfully");
    return { success: true, message: "LinkedIn session connected successfully." };
  } catch (err) {
    await session.close().catch(() => void 0);
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ tenantId: payload.tenantId, err: msg }, "LinkedIn login error");
    await writeLoginResult(payload.tenantId, "failed", `Login error: ${msg}`);
    return { success: false, message: `Login error: ${msg}` };
  }
}
