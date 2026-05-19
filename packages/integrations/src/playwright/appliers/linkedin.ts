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

const NEXT_BTN = [
  'button[aria-label="Continue to next step"]',
  'button[aria-label="Review your application"]',
  'button:has-text("Next")',
  'button:has-text("Review")',
  'footer button:not([aria-label*="Dismiss"]):not([aria-label*="Close"])',
].join(", ");

const SUBMIT_BTN = [
  'button[aria-label="Submit application"]',
  'button:has-text("Submit application")',
  'button:has-text("Submit")',
].join(", ");

const DISMISS_BTN = [
  'button[aria-label="Dismiss"]',
  'button[aria-label="Close"]',
  'button:has-text("Discard")',
].join(", ");

async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  return !url.includes("/login") && !url.includes("/authwall") && !url.includes("/checkpoint");
}

async function clickEasyApply(page: Page): Promise<"easy-apply" | "external" | "not-found"> {
  // Wait up to 15s for page to settle
  await page.waitForTimeout(3000);

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

export async function applyViaLinkedIn(input: {
  page: Page;
  jobUrl: string;
  profile: UserProfile;
  cvPath?: string;
  coverLetterPath?: string;
  jobContext: { company: string; position: string; description?: string };
  dryRun?: boolean;
}): Promise<LinkedInApplyResult> {
  const { page } = input;

  // Navigate to job — use "load" so JS-rendered content (Apply button) is present
  await page.goto(input.jobUrl, { waitUntil: "load", timeout: 45_000 });
  await humanDelay(2500, 4000);

  if (!(await isLoggedIn(page))) {
    return { success: false, message: "LinkedIn session expired — re-run save-session to log in again", stepsCompleted: 0 };
  }

  const applyType = await clickEasyApply(page);

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

  while (steps < MAX_STEPS) {
    steps++;
    await humanDelay(800, 1500);

    // Check if submit button is visible — final step
    const submitBtn = page.locator(SUBMIT_BTN).first();
    const isSubmitStep = await submitBtn.isVisible().catch(() => false);

    if (isSubmitStep) {
      if (input.dryRun) {
        await dismissModal(page);
        return { success: true, message: "DRY RUN — form filled successfully, not submitted", stepsCompleted: steps };
      }

      await submitBtn.click();
      await humanDelay(2000, 3000);

      // Check for confirmation
      const confirmed =
        (await page.locator('h2:has-text("Your application was sent")').isVisible().catch(() => false)) ||
        (await page.locator('[data-test-modal-id="application-submitted-modal"]').isVisible().catch(() => false)) ||
        (await page.locator('text="Application submitted"').isVisible().catch(() => false));

      return {
        success: confirmed,
        message: confirmed ? "Application submitted successfully" : "Submit clicked but confirmation not detected",
        stepsCompleted: steps,
      };
    }

    // Fill current step's form fields
    const fillResult = await fillFormPage({
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

    void fillResult; // logged by caller

    // Click Next
    const nextBtn = page.locator(NEXT_BTN).first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await humanDelay(1000, 2000);
    } else {
      // No next button and no submit — might be stuck
      break;
    }
  }

  return { success: false, message: `Modal not submitted after ${steps} steps`, stepsCompleted: steps };
}
