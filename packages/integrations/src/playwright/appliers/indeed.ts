/**
 * Indeed Apply automator.
 *
 * Indeed has its own multi-step application flow:
 * - "Apply on Indeed" button → opens indeed application in same tab or iframe
 * - Steps: contact info, resume upload, screening questions, cover letter, review, submit
 */

import type { Page } from "playwright";
import { fillFormPage, uploadFile } from "../form-filler";
import type { UserProfile } from "../form-filler";
import { humanDelay } from "../browser";

export interface IndeedApplyResult {
  success: boolean;
  message: string;
  stepsCompleted: number;
}

const APPLY_BTN = [
  '#indeedApplyButton',
  'button[data-testid="indeedApply"]',
  'button:has-text("Apply now")',
  'button:has-text("Apply on Indeed")',
  'a:has-text("Apply on Indeed")',
].join(", ");

const CONTINUE_BTN = [
  'button[data-testid="continueButton"]',
  'button:has-text("Continue")',
  'button:has-text("Next")',
  'button[type="submit"]:not([form])',
].join(", ");

const SUBMIT_BTN = [
  'button[data-testid="submitButton"]',
  'button:has-text("Submit your application")',
  'button:has-text("Submit")',
].join(", ");

async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  return !url.includes("/account/login") && !url.includes("/auth");
}

export async function applyViaIndeed(input: {
  page: Page;
  jobUrl: string;
  profile: UserProfile;
  cvPath?: string;
  coverLetterPath?: string;
  jobContext: { company: string; position: string; description?: string };
  dryRun?: boolean;
}): Promise<IndeedApplyResult> {
  const { page } = input;

  await page.goto(input.jobUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await humanDelay(2000, 3500);

  if (!(await isLoggedIn(page))) {
    return { success: false, message: "Indeed session expired — re-run save-session to log in again", stepsCompleted: 0 };
  }

  // Click apply button
  const applyBtn = page.locator(APPLY_BTN).first();
  if (!(await applyBtn.isVisible().catch(() => false))) {
    return { success: false, message: "No Apply button found on Indeed job page", stepsCompleted: 0 };
  }

  await applyBtn.click();
  await humanDelay(2000, 3000);

  // Indeed may open application in a new page/tab or stay on same page
  let applyPage = page;
  const pages = page.context().pages();
  if (pages.length > 1) {
    applyPage = pages[pages.length - 1];
    await applyPage.waitForLoadState("domcontentloaded");
    await humanDelay(1500, 2500);
  }

  let steps = 0;
  const MAX_STEPS = 12;

  while (steps < MAX_STEPS) {
    steps++;
    await humanDelay(800, 1500);

    // Upload resume if file input is present
    if (input.cvPath) {
      const resumeInput = applyPage.locator('input[type="file"]').first();
      if (await resumeInput.isVisible().catch(() => false)) {
        await uploadFile(applyPage, 'input[type="file"]', input.cvPath);
        await humanDelay(1000, 2000);
      }
    }

    // Fill form fields
    await fillFormPage({
      page: applyPage,
      profile: input.profile,
      jobContext: input.jobContext,
      cvPath: input.cvPath,
      coverLetterPath: input.coverLetterPath,
    });

    // Check for submit
    const submitBtn = applyPage.locator(SUBMIT_BTN).first();
    if (await submitBtn.isVisible().catch(() => false)) {
      if (input.dryRun) {
        return { success: true, message: "DRY RUN — form filled, not submitted", stepsCompleted: steps };
      }
      await submitBtn.click();
      await humanDelay(2000, 3000);

      const confirmed =
        (await applyPage.locator('h1:has-text("application was sent")').isVisible().catch(() => false)) ||
        (await applyPage.locator('text="Application submitted"').isVisible().catch(() => false)) ||
        (await applyPage.locator('[data-testid="applicationSubmitted"]').isVisible().catch(() => false));

      return {
        success: confirmed,
        message: confirmed ? "Application submitted on Indeed" : "Submit clicked but confirmation not detected",
        stepsCompleted: steps,
      };
    }

    // Continue to next step
    const continueBtn = applyPage.locator(CONTINUE_BTN).first();
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
      await humanDelay(1200, 2500);
    } else {
      break;
    }
  }

  return { success: false, message: `Application not completed after ${steps} steps`, stepsCompleted: steps };
}
