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
  return !url.includes("/login") && !url.includes("/authwall") && !url.includes("/checkpoint");
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
