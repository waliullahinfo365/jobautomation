/**
 * LinkedIn Easy Apply automator.
 *
 * Flow:
 * 1. Navigate to job page
 * 2. Verify session is valid (redirect to login = session expired)
 * 3. Click "Easy Apply" button
 * 4. Loop through modal steps, filling each page with AI
 * 5. Handle file uploads (CV, cover letter)
 * 6. Submit and confirm
 */

import type { Page } from "playwright";
import { fillFormPage, uploadFile } from "../form-filler";
import type { UserProfile } from "../form-filler";
import { humanDelay } from "../browser";

export interface LinkedInApplyResult {
  success: boolean;
  message: string;
  stepsCompleted: number;
  appliedViaExternalUrl?: string;
}

const EASY_APPLY_BTN = [
  'button[aria-label*="Easy Apply"]',
  'button[data-control-name="jobdetail_topcard_inapply"]',
  'button.jobs-apply-button',
  '.jobs-apply-button',
  '.jobs-s-apply button',
  '.jobs-unified-top-card__cta-container button',
  'button:has-text("Easy Apply")',
  '[data-job-id] button:has-text("Apply")',
  // LinkedIn sometimes renders as span/div inside an anchor or li
  'a:has-text("Easy Apply")',
  'li:has-text("Easy Apply") a',
  '[class*="apply"]:has-text("Easy Apply")',
  'span:has-text("Easy Apply")',
].join(", ");

// All Next selectors MUST be scoped to the modal to avoid matching page-level carousel buttons
const NEXT_BTN = [
  '.jobs-easy-apply-modal button[aria-label="Continue to next step"]',
  '.jobs-easy-apply-modal button[aria-label="Review your application"]',
  '.jobs-easy-apply-modal button[aria-label="Next"]',
  '.jobs-easy-apply-modal button:has-text("Next")',
  '.jobs-easy-apply-modal button:has-text("Review")',
  '.jobs-easy-apply-modal button:has-text("Continue")',
  '.jobs-easy-apply-modal button:has-text("Save and continue")',
  '[role="dialog"] button[aria-label="Continue to next step"]',
  '[role="dialog"] button[aria-label="Review your application"]',
  '[role="dialog"] button[aria-label="Next"]:not([data-testid*="carousel"])',
  '[role="dialog"] button:has-text("Next"):not([data-testid*="carousel"])',
  '[role="dialog"] button:has-text("Review")',
  '[role="dialog"] button:has-text("Continue")',
  '[role="dialog"] button:has-text("Save and continue")',
  '.jobs-easy-apply-modal footer button:not([aria-label*="Dismiss"]):not([aria-label*="Close"]):not([aria-label*="Back"])',
  '[role="dialog"] footer button:not([aria-label*="Dismiss"]):not([aria-label*="Close"]):not([aria-label*="Back"])',
  '.artdeco-modal button[aria-label="Continue to next step"]',
  '.artdeco-modal button[aria-label="Review your application"]',
  '.artdeco-modal button:has-text("Review")',
  '.artdeco-modal button:has-text("Continue")',
  '.artdeco-modal footer button:not([aria-label*="Dismiss"]):not([aria-label*="Close"]):not([aria-label*="Back"])',
].join(", ");

const SUBMIT_BTN = [
  '.jobs-easy-apply-modal button[aria-label="Submit application"]',
  '[role="dialog"] button[aria-label="Submit application"]',
  '.jobs-easy-apply-modal button:has-text("Submit application")',
  '[role="dialog"] button:has-text("Submit application")',
  '[role="dialog"] button[aria-label*="Submit"]',
  // Broad fallbacks — LinkedIn may render modal outside [role="dialog"]
  'button[aria-label="Submit application"]',
  'button:has-text("Submit application")',
].join(", ");

const DISMISS_BTN = [
  'button[aria-label="Dismiss"]',
  'button[aria-label="Close"]',
  'button:has-text("Discard")',
].join(", ");

async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  // Explicit session-expired / auth-wall URL patterns
  if (
    url.includes("/uas/login") ||
    url.includes("/uas/") ||
    url.includes("/login") ||
    url.includes("/authwall") ||
    url.includes("/checkpoint") ||
    url.includes("session_redirect")
  ) return false;
  // LinkedIn redirects logged-out users to the root homepage — detect by title
  const title = await page.title().catch(() => "");
  if (/log in or sign up/i.test(title) || /join linkedin/i.test(title) || /sign in/i.test(title)) return false;
  // Root domain with no meaningful path = logged-out redirect
  if (/^https?:\/\/www\.linkedin\.com\/?(\?.*)?$/.test(url)) return false;
  return true;
}

async function clickEasyApply(page: Page): Promise<"easy-apply" | "external" | "not-found" | "session-expired"> {
  // Wait up to 15s for page to settle (LinkedIn may do a delayed JS redirect to login)
  await page.waitForTimeout(3000);

  // Re-check login after the wait — LinkedIn sometimes redirects to /checkpoint after initial load
  if (!(await isLoggedIn(page))) return "session-expired";

  // Try to find Easy Apply via text content anywhere on page (handles span/div/button/a)
  const easyApplyEl = page.getByText("Easy Apply", { exact: true }).first();
  const easyApplyVisible = await easyApplyEl.isVisible().catch(() => false);

  if (easyApplyVisible) {
    await humanDelay(500, 1000);
    // Try normal click first
    await easyApplyEl.click({ force: true }).catch(() => void 0);
    await humanDelay(1500, 2500);

    // Check if modal opened (any dialog or application form appeared)
    const modalOpen =
      (await page.locator('[role="dialog"]').isVisible().catch(() => false)) ||
      (await page.locator('.jobs-easy-apply-modal').isVisible().catch(() => false)) ||
      (await page.locator('h3:has-text("Contact info")').isVisible().catch(() => false)) ||
      (await page.locator('h3:has-text("Resume")').isVisible().catch(() => false)) ||
      (await page.locator('button[aria-label="Submit application"]').isVisible().catch(() => false)) ||
      (await page.locator('button:has-text("Next")').isVisible().catch(() => false));

    if (modalOpen) return "easy-apply";

    // Modal didn't open — try JS click on the element
    await easyApplyEl.evaluate((el: Element) => (el as HTMLElement).click()).catch(() => void 0);
    await humanDelay(1500, 2000);

    const modalOpenAfterJs =
      (await page.locator('[role="dialog"]').isVisible().catch(() => false)) ||
      (await page.locator('button:has-text("Next")').isVisible().catch(() => false)) ||
      (await page.locator('button[aria-label="Submit application"]').isVisible().catch(() => false));

    if (modalOpenAfterJs) return "easy-apply";
  }

  // Check for external Apply button
  const externalBtn = page.locator('a:has-text("Apply on company website"), a[href*="apply"]').first();
  if (await externalBtn.isVisible().catch(() => false)) {
    return "external";
  }

  return "not-found";
}

/** Fill all visible number inputs that are 0 or empty using Playwright's fill (React-compatible) */
/** Fill all decimal/number inputs that are 0 or empty, including type="text" with numeric validation */
async function fixNumberInputs(page: Page, yearsExperience: number): Promise<void> {
  try {
    // 1. Fix standard type="number" inputs
    const numInputs = page.locator('input[type="number"]');
    const numCount = await numInputs.count().catch(() => 0);
    for (let i = 0; i < numCount; i++) {
      const input = numInputs.nth(i);
      if (!await input.isVisible().catch(() => false)) continue;
      const val = await input.inputValue().catch(() => "");
      if (!val || parseFloat(val) <= 0) {
        await input.fill(String(yearsExperience)).catch(() => void 0);
        await input.press("Tab").catch(() => void 0);
        await humanDelay(200, 300);
      }
    }

    // 2. Fix inputs near "decimal number" validation errors (LinkedIn uses type="text" for these)
    const errors = page.locator('.artdeco-inline-feedback--error, [data-test-form-element-error-message], .fb-form-element__error-text');
    const errCount = await errors.count().catch(() => 0);
    for (let i = 0; i < errCount; i++) {
      const err = errors.nth(i);
      const text = await err.innerText().catch(() => "");
      if (!text.toLowerCase().includes("decimal") && !text.toLowerCase().includes("number larger") && !text.toLowerCase().includes("number greater")) continue;

      // Walk up the DOM from the error to find the associated input
      const inputId = await err.evaluate((el) => {
        let node: Element | null = el;
        for (let d = 0; d < 6; d++) {
          node = node?.parentElement ?? null;
          if (!node) break;
          const inp = node.querySelector('input');
          if (inp) return inp.id || inp.getAttribute("name") || null;
        }
        return null;
      }).catch(() => null);

      if (inputId) {
        const target = page.locator(`input[id="${inputId}"], input[name="${inputId}"]`).first();
        await target.fill(String(yearsExperience)).catch(() => void 0);
        await target.press("Tab").catch(() => void 0);
        await humanDelay(200, 300);
      }
    }
  } catch {
    // ignore
  }
}

async function dismissModal(page: Page): Promise<void> {
  try {
    const btn = page.locator(DISMISS_BTN).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await humanDelay(500, 1000);
      // Confirm discard if prompted
      const discardConfirm = page.locator('button:has-text("Discard")').first();
      if (await discardConfirm.isVisible().catch(() => false)) {
        await discardConfirm.click();
      }
    }
  } catch {
    // ignore
  }
}

/** Strip LinkedIn tracking params that trigger bot detection (trackingId, refId, etc.) */
function cleanLinkedInUrl(url: string): string {
  try {
    const u = new URL(url);
    ["trackingId", "refId", "trk", "src", "lipi", "lici"].forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
}

export async function applyViaLinkedIn(input: {
  page: Page;
  jobUrl: string;
  profile: UserProfile;
  cvPath?: string;
  coverLetterPath?: string;
  jobContext: { company: string; position: string; description?: string };
  dryRun?: boolean;
  proxyUrl?: string;
}): Promise<LinkedInApplyResult> {
  const { page } = input;
  const jobUrl = cleanLinkedInUrl(input.jobUrl);
  const hasConfiguredProxy = Boolean(input.proxyUrl?.trim() || process.env.PROXY_URL || process.env.PLAYWRIGHT_PROXY_URL);

  // Log which IP the proxy is routing through — visible in Railway logs
  try {
    await page.goto("https://api.ipify.org?format=json", { waitUntil: "domcontentloaded", timeout: 10_000 });
    const ipBody = await page.locator("body").innerText().catch(() => "{}");
    const ip = (JSON.parse(ipBody) as { ip?: string }).ip ?? "unknown";
    console.log(`[linkedin-apply] outbound IP: ${ip}`);
  } catch {
    console.log("[linkedin-apply] could not detect outbound IP");
  }

  // Warm up the session — visit /feed with networkidle so all redirects complete
  // before we check login state. LinkedIn is less suspicious of subsequent
  // navigation when there's prior activity on the domain.
  try {
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "networkidle", timeout: 30_000 });
    await humanDelay(2000, 3500);
  } catch {
    // networkidle timeout is acceptable on slow connections — fall back to URL check
    await humanDelay(1000, 2000);
  }

  const feedUrl = page.url();
  console.log(`[linkedin-apply] after /feed warm-up, URL: ${feedUrl}`);

  if (!(await isLoggedIn(page))) {
    const message = hasConfiguredProxy
      ? `LinkedIn session expired or blocked on the configured proxy — URL after /feed: ${feedUrl}. Reconnect LinkedIn through the same stable residential proxy used by the worker, or rotate to a trusted residential IP and save a fresh session through that IP.`
      : `LinkedIn session expired or blocked from the Railway server IP — URL after /feed: ${feedUrl}. Browser-exported cookies are tied to the IP where they were created; set PROXY_URL/PLAYWRIGHT_PROXY_URL to a stable residential proxy and save/import the LinkedIn session through that same proxy before retrying.`;
    return { success: false, message, stepsCompleted: 0 };
  }

  // Navigate to job page using the cleaned URL (no tracking params)
  await page.goto(jobUrl, { waitUntil: "load", timeout: 45_000 });
  await humanDelay(2500, 4000);

  if (!(await isLoggedIn(page))) {
    const currentUrl = page.url();
    const title = await page.title().catch(() => "");
    // If redirected to /uas/login with session_redirect, the session cookie is not
    // being accepted for job pages — likely a cookie scope or IP block issue.
    const isUasLogin = currentUrl.includes("/uas/login") || currentUrl.includes("/uas/");
    return {
      success: false,
      message: isUasLogin
        ? hasConfiguredProxy
          ? "LinkedIn session expired on the configured proxy. Reconnect LinkedIn through the same stable residential proxy used by the worker."
          : "LinkedIn session expired from the Railway server IP. Configure a stable residential proxy and create the LinkedIn session through that same IP; re-importing home-IP cookies will keep failing."
        : `LinkedIn blocked navigation to job page (redirected to: ${currentUrl}, title: "${title}"). Try setting PROXY_URL in Railway env.`,
      stepsCompleted: 0,
    };
  }

  const applyType = await clickEasyApply(page);

  if (applyType === "session-expired") {
    return { success: false, message: "LinkedIn session expired — re-run save-session to log in again", stepsCompleted: 0 };
  }

  if (applyType === "not-found") {
    // Capture page state for debugging
    const currentUrl = page.url();
    const pageTitle = await page.title().catch(() => "unknown");
    const bodyText = await page.locator("body").innerText().catch(() => "").then((t) => t.slice(0, 500));
    const allButtons = await page.locator("button").allInnerTexts().catch(() => [] as string[]);
    return {
      success: false,
      message: `No Apply button found. URL: ${currentUrl} | Title: ${pageTitle} | Buttons: [${allButtons.slice(0, 10).join(" | ")}] | Body: ${bodyText}`,
      stepsCompleted: 0,
    };
  }

  if (applyType === "external") {
    // Get external URL and return it so the generic applier can handle it
    const href = await page.locator('a:has-text("Apply on company website")').getAttribute("href").catch(() => null);
    return {
      success: false,
      message: "Job redirects to external application page",
      stepsCompleted: 0,
      appliedViaExternalUrl: href ?? undefined,
    };
  }

  // Easy Apply modal is now open
  let steps = 0;
  const MAX_STEPS = 15;
  const stepLog: string[] = [];

  while (steps < MAX_STEPS) {
    steps++;
    await humanDelay(1000, 1800);

    // Get current modal heading for logging — broad selectors since LinkedIn modal may not use role="dialog"
    const heading = await page.locator('[role="dialog"] h3, [role="dialog"] h2, .jobs-easy-apply-modal h3, .jobs-easy-apply-content h3, .artdeco-modal h3, .artdeco-modal h2').first().innerText().catch(() => `step ${steps}`);
    stepLog.push(heading.trim().slice(0, 60));

    // Check if submit button is visible — final step
    const submitBtn = page.locator(SUBMIT_BTN).first();
    const isSubmitStep = await submitBtn.isVisible().catch(() => false);

    if (isSubmitStep) {
      if (input.dryRun) {
        await dismissModal(page);
        return { success: true, message: `DRY RUN — filled ${steps} steps: ${stepLog.join(" → ")}`, stepsCompleted: steps };
      }

      // Scroll submit button into view and wait for it to be enabled
      await submitBtn.scrollIntoViewIfNeeded().catch(() => void 0);
      await humanDelay(500, 800);

      // Try normal click first, then force click, then JS click
      const clicked = await submitBtn.click({ timeout: 5000 }).then(() => true).catch(() => false);
      if (!clicked) {
        await submitBtn.click({ force: true }).catch(() => void 0);
      }

      // Wait up to 8s for confirmation or modal to close
      await humanDelay(3000, 4000);

      // Modal closing = success (LinkedIn closes it after submit)
      const modalStillOpen = await page.locator('[role="dialog"]').isVisible().catch(() => false);

      const confirmed =
        !modalStillOpen ||
        (await page.locator('h2:has-text("Your application was sent")').isVisible().catch(() => false)) ||
        (await page.locator('[data-test-modal-id="application-submitted-modal"]').isVisible().catch(() => false)) ||
        (await page.locator('text="Application submitted"').isVisible().catch(() => false)) ||
        (await page.locator('[class*="post-apply"]').isVisible().catch(() => false)) ||
        (await page.locator('text="applied to"').isVisible().catch(() => false));

      // If modal is still open, check if it changed to a success state
      if (!confirmed && modalStillOpen) {
        // Wait a bit more — LinkedIn sometimes takes time to show confirmation
        await humanDelay(2000, 3000);
        const confirmedLate =
          (await page.locator('h2:has-text("Your application was sent")').isVisible().catch(() => false)) ||
          !(await page.locator('[role="dialog"]').isVisible().catch(() => false));

        return {
          success: confirmedLate,
          message: confirmedLate
            ? `Application submitted after ${steps} steps: ${stepLog.join(" → ")}`
            : `Submit clicked but modal still open and no confirmation. Steps: ${stepLog.join(" → ")}`,
          stepsCompleted: steps,
        };
      }

      return {
        success: confirmed,
        message: confirmed
          ? `Application submitted after ${steps} steps: ${stepLog.join(" → ")}`
          : `Submit clicked but confirmation not detected. Steps: ${stepLog.join(" → ")}`,
        stepsCompleted: steps,
      };
    }

    // Fill current step's form fields
    await fillFormPage({
      page,
      profile: input.profile,
      jobContext: input.jobContext,
      cvPath: input.cvPath,
      coverLetterPath: input.coverLetterPath,
    });

    // Upload CV if there's a file input in this step
    if (input.cvPath) {
      const cvInput = page.locator('input[type="file"]').first();
      if (await cvInput.isVisible().catch(() => false)) {
        await uploadFile(page, 'input[type="file"]', input.cvPath);
      }
    }

    await humanDelay(600, 1000);

    // Clear any pre-existing validation errors by force-filling all number inputs > 0
    await fixNumberInputs(page, input.profile.yearsExperience ?? 20);

    // Click Next
    const nextBtn = page.locator(NEXT_BTN).first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.scrollIntoViewIfNeeded().catch(() => void 0);
      await humanDelay(300, 600);
      await nextBtn.click({ force: true, timeout: 10_000 });
      await humanDelay(1500, 2500);
    } else {
      const visibleBtns = await page.locator('[role="dialog"] button, .jobs-easy-apply-modal button, .artdeco-modal button').allInnerTexts().catch(() => [] as string[]);
      const allPageBtns = await page.locator('button:visible').allInnerTexts().catch(() => [] as string[]);
      return { success: false, message: `No Next/Submit button on step ${steps} (${heading.trim()}). Modal buttons: [${visibleBtns.join(" | ")}]. All page buttons: [${allPageBtns.slice(0, 15).join(" | ")}]. Steps: ${stepLog.join(" → ")}`, stepsCompleted: steps };
    }

    // Check for validation errors AFTER clicking Next (LinkedIn validates on Next click)
    const hasErrorAfterNext = await page.locator('.artdeco-inline-feedback--error, [data-test-form-element-error-message], .fb-form-element__error-text').first().isVisible().catch(() => false);
    if (hasErrorAfterNext) {
      // Try to fix number fields and retry Next once
      await fixNumberInputs(page, input.profile.yearsExperience ?? 20);
      await humanDelay(800, 1200);
      await nextBtn.click({ force: true, timeout: 10_000 }).catch(() => void 0);
      await humanDelay(1500, 2000);

      // If still erroring, report failure
      const stillError = await page.locator('.artdeco-inline-feedback--error, [data-test-form-element-error-message], .fb-form-element__error-text').first().isVisible().catch(() => false);
      if (stillError) {
        const errorText = await page.locator('.artdeco-inline-feedback--error, [data-test-form-element-error-message], .fb-form-element__error-text').first().innerText().catch(() => "unknown error");
        return { success: false, message: `Validation error on step ${steps} (${heading.trim()}): ${errorText.trim()}. Steps so far: ${stepLog.join(" → ")}`, stepsCompleted: steps };
      }
    }
  }

  return { success: false, message: `Reached max steps (${MAX_STEPS}). Steps: ${stepLog.join(" → ")}`, stepsCompleted: steps };
}
