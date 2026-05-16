import { saveSession } from "@jobflow/integrations/playwright/session-store";
import { launchBrowser } from "@jobflow/integrations/playwright/browser";
import type { LinkedInLoginPayload } from "@jobflow/shared/types/queue";
import { logger } from "../utils/logger";

const LOGIN_URL = "https://www.linkedin.com/login";
const FEED_URL = "https://www.linkedin.com/feed";
const TIMEOUT = 30_000;

export async function processLinkedInLogin(payload: LinkedInLoginPayload): Promise<{
  success: boolean;
  message: string;
}> {
  logger.info({ tenantId: payload.tenantId }, "Starting LinkedIn credential login");

  const session = await launchBrowser({ headless: true });
  const { page, context } = session;

  try {
    await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: TIMEOUT });

    // Fill credentials
    await page.fill("#username", payload.email);
    await page.fill("#password", payload.password);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: TIMEOUT }),
      page.click('[data-litms-control-urn="login-submit"], button[type="submit"]'),
    ]);

    const currentUrl = page.url();

    // Check for 2FA / verification challenge
    if (currentUrl.includes("/checkpoint") || currentUrl.includes("/challenge") || currentUrl.includes("/uas/")) {
      await session.close();
      return {
        success: false,
        message:
          "LinkedIn requires verification (2FA or CAPTCHA). Please log in manually via the CLI: pnpm save-session linkedin",
      };
    }

    // Check for error
    const errorEl = await page.locator(".alert-content, .login__form_error_container").first().isVisible().catch(() => false);
    if (errorEl) {
      const errorText = await page.locator(".alert-content, .login__form_error_container").first().textContent().catch(() => "");
      await session.close();
      return { success: false, message: `Login failed: ${errorText?.trim() ?? "Wrong email or password"}` };
    }

    // Verify we are logged in (landed on feed, home, or mynetwork)
    const loggedIn =
      currentUrl.includes("/feed") ||
      currentUrl.includes("/home") ||
      currentUrl.includes("/mynetwork") ||
      currentUrl.includes("/jobs") ||
      currentUrl === "https://www.linkedin.com/";

    if (!loggedIn) {
      // Try navigating to feed to confirm
      await page.goto(FEED_URL, { waitUntil: "domcontentloaded", timeout: TIMEOUT });
      const afterUrl = page.url();
      if (afterUrl.includes("/login") || afterUrl.includes("/checkpoint")) {
        await session.close();
        return { success: false, message: "Login did not succeed — still on login or checkpoint page." };
      }
    }

    // Save session to MongoDB
    const storageState = await context.storageState();
    await saveSession({ tenantId: payload.tenantId, platform: "linkedin", storageState });

    await session.close();
    logger.info({ tenantId: payload.tenantId }, "LinkedIn session saved successfully");
    return { success: true, message: "LinkedIn session connected successfully." };
  } catch (err) {
    await session.close().catch(() => void 0);
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ tenantId: payload.tenantId, err: msg }, "LinkedIn login error");
    return { success: false, message: `Login error: ${msg}` };
  }
}
