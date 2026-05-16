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
  'button.jobs-apply-button',
  '.jobs-apply-button',
  'button:has-text("Easy Apply")',
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
  await humanDelay(1500, 2500);

  // Check for Easy Apply
  const easyApplyBtn = page.locator(EASY_APPLY_BTN).first();
  if (await easyApplyBtn.isVisible().catch(() => false)) {
    await easyApplyBtn.click();
    await humanDelay(1000, 2000);
    return "easy-apply";
  }

  // Check for external Apply button
  const externalBtn = page.locator('button:has-text("Apply"), a:has-text("Apply on company website")').first();
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

  // Navigate to job
  await page.goto(input.jobUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await humanDelay(2000, 3500);

  if (!(await isLoggedIn(page))) {
    return { success: false, message: "LinkedIn session expired — re-run save-session to log in again", stepsCompleted: 0 };
  }

  const applyType = await clickEasyApply(page);

  if (applyType === "not-found") {
    return { success: false, message: "No Apply button found on this job page", stepsCompleted: 0 };
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
