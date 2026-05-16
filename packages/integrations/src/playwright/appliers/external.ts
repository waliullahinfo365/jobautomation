/**
 * External ATS applier — handles Greenhouse, Lever, Workday, and generic job sites.
 *
 * Strategy for each platform:
 * - Greenhouse: form on page, submit at bottom
 * - Lever: similar single-page form
 * - Workday: multi-step wizard, most complex
 * - Generic: attempt to find and fill any form on the page
 */

import type { Page } from "playwright";
import { fillFormPage, uploadFile } from "../form-filler";
import type { UserProfile } from "../form-filler";
import { humanDelay } from "../browser";
import type { ApplyPlatform } from "../session-store";

export interface ExternalApplyResult {
  success: boolean;
  message: string;
  stepsCompleted: number;
  platform: ApplyPlatform;
}

// ─── Greenhouse ────────────────────────────────────────────────────────────────

async function applyGreenhouse(input: {
  page: Page;
  profile: UserProfile;
  cvPath?: string;
  coverLetterPath?: string;
  jobContext: { company: string; position: string; description?: string };
  dryRun?: boolean;
}): Promise<ExternalApplyResult> {
  const { page } = input;

  await humanDelay(2000, 3000);

  // Greenhouse is usually a single-page form
  await fillFormPage({
    page,
    profile: input.profile,
    jobContext: input.jobContext,
    cvPath: input.cvPath,
    coverLetterPath: input.coverLetterPath,
  });

  // Upload resume
  if (input.cvPath) {
    const resumeInput = page.locator('input[type="file"]').first();
    if (await resumeInput.isVisible().catch(() => false)) {
      await uploadFile(page, 'input[type="file"]', input.cvPath);
    }
  }

  if (input.dryRun) {
    return { success: true, message: "DRY RUN — Greenhouse form filled", stepsCompleted: 1, platform: "greenhouse" };
  }

  const submitBtn = page.locator('input[type="submit"], button[type="submit"], button:has-text("Submit Application")').first();
  if (await submitBtn.isVisible().catch(() => false)) {
    await submitBtn.click();
    await humanDelay(2000, 3000);
    return { success: true, message: "Greenhouse application submitted", stepsCompleted: 1, platform: "greenhouse" };
  }

  return { success: false, message: "Greenhouse: Submit button not found", stepsCompleted: 1, platform: "greenhouse" };
}

// ─── Lever ─────────────────────────────────────────────────────────────────────

async function applyLever(input: {
  page: Page;
  profile: UserProfile;
  cvPath?: string;
  coverLetterPath?: string;
  jobContext: { company: string; position: string; description?: string };
  dryRun?: boolean;
}): Promise<ExternalApplyResult> {
  const { page } = input;

  await humanDelay(2000, 3000);

  // Click "Apply for this job" button if present
  const applyBtn = page.locator('a:has-text("Apply for this job"), button:has-text("Apply for this job")').first();
  if (await applyBtn.isVisible().catch(() => false)) {
    await applyBtn.click();
    await humanDelay(1500, 2500);
  }

  await fillFormPage({
    page,
    profile: input.profile,
    jobContext: input.jobContext,
    cvPath: input.cvPath,
    coverLetterPath: input.coverLetterPath,
  });

  if (input.cvPath) {
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible().catch(() => false)) {
      await uploadFile(page, 'input[type="file"]', input.cvPath);
    }
  }

  if (input.dryRun) {
    return { success: true, message: "DRY RUN — Lever form filled", stepsCompleted: 1, platform: "lever" };
  }

  const submitBtn = page.locator('button:has-text("Submit Application"), button[type="submit"]').first();
  if (await submitBtn.isVisible().catch(() => false)) {
    await submitBtn.click();
    await humanDelay(2000, 3000);
    const confirmed = await page.locator('text="Application submitted"').isVisible().catch(() => false);
    return {
      success: confirmed,
      message: confirmed ? "Lever application submitted" : "Submit clicked, confirmation not detected",
      stepsCompleted: 1,
      platform: "lever",
    };
  }

  return { success: false, message: "Lever: Submit button not found", stepsCompleted: 1, platform: "lever" };
}

// ─── Workday (multi-step wizard) ───────────────────────────────────────────────

async function applyWorkday(input: {
  page: Page;
  profile: UserProfile;
  cvPath?: string;
  coverLetterPath?: string;
  jobContext: { company: string; position: string; description?: string };
  dryRun?: boolean;
}): Promise<ExternalApplyResult> {
  const { page } = input;

  await humanDelay(2000, 3000);

  // Click "Apply" button
  const applyBtn = page
    .locator('[data-automation-id="applyButton"], button:has-text("Apply"), a:has-text("Apply")')
    .first();
  if (await applyBtn.isVisible().catch(() => false)) {
    await applyBtn.click();
    await humanDelay(2000, 3000);
  }

  let steps = 0;
  const MAX_STEPS = 20;

  while (steps < MAX_STEPS) {
    steps++;
    await humanDelay(1000, 2000);

    // Upload resume
    if (input.cvPath && steps === 1) {
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible().catch(() => false)) {
        await uploadFile(page, 'input[type="file"]', input.cvPath);
        await humanDelay(1500, 2500);
      }
    }

    // Fill form
    await fillFormPage({
      page,
      profile: input.profile,
      jobContext: input.jobContext,
      cvPath: input.cvPath,
      coverLetterPath: input.coverLetterPath,
    });

    // Check for submit/review
    const submitBtn = page
      .locator('[data-automation-id="bottom-navigation-next-button"]')
      .or(page.locator('button:has-text("Submit")'))
      .first();

    const isLastStep = await submitBtn.evaluate((el: HTMLElement) => {
      const text = el.textContent?.toLowerCase() ?? "";
      return text.includes("submit");
    }).catch(() => false);

    if (isLastStep) {
      if (input.dryRun) {
        return { success: true, message: "DRY RUN — Workday form filled", stepsCompleted: steps, platform: "workday" };
      }
      await submitBtn.click();
      await humanDelay(3000, 5000);
      return { success: true, message: "Workday application submitted", stepsCompleted: steps, platform: "workday" };
    }

    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await humanDelay(1500, 2500);
    } else {
      break;
    }
  }

  return { success: false, message: `Workday: Not submitted after ${steps} steps`, stepsCompleted: steps, platform: "workday" };
}

// ─── Generic fallback ──────────────────────────────────────────────────────────

async function applyGeneric(input: {
  page: Page;
  profile: UserProfile;
  cvPath?: string;
  coverLetterPath?: string;
  jobContext: { company: string; position: string; description?: string };
  dryRun?: boolean;
}): Promise<ExternalApplyResult> {
  const { page } = input;

  await humanDelay(2000, 3000);

  let steps = 0;
  const MAX_STEPS = 10;

  while (steps < MAX_STEPS) {
    steps++;

    // Upload files
    if (input.cvPath) {
      const fileInputs = page.locator('input[type="file"]');
      const count = await fileInputs.count();
      for (let i = 0; i < count; i++) {
        await uploadFile(page, `input[type="file"]:nth-of-type(${i + 1})`, input.cvPath);
      }
    }

    await fillFormPage({
      page,
      profile: input.profile,
      jobContext: input.jobContext,
      cvPath: input.cvPath,
      coverLetterPath: input.coverLetterPath,
    });

    await humanDelay(800, 1500);

    // Look for submit
    const submitBtn = page
      .locator('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Apply")')
      .first();
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")').first();

    if (await submitBtn.isVisible().catch(() => false)) {
      if (input.dryRun) {
        return { success: true, message: "DRY RUN — generic form filled", stepsCompleted: steps, platform: "generic" };
      }
      await submitBtn.click();
      await humanDelay(2000, 3000);
      return { success: true, message: "Generic application submitted", stepsCompleted: steps, platform: "generic" };
    }

    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await humanDelay(1500, 2500);
    } else {
      break;
    }
  }

  return { success: false, message: `Generic: Application incomplete after ${steps} steps`, stepsCompleted: steps, platform: "generic" };
}

// ─── Main entry ────────────────────────────────────────────────────────────────

export async function applyViaExternal(input: {
  page: Page;
  jobUrl: string;
  platform: ApplyPlatform;
  profile: UserProfile;
  cvPath?: string;
  coverLetterPath?: string;
  jobContext: { company: string; position: string; description?: string };
  dryRun?: boolean;
}): Promise<ExternalApplyResult> {
  const { page } = input;

  await page.goto(input.jobUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await humanDelay(2000, 3500);

  const common = {
    page,
    profile: input.profile,
    cvPath: input.cvPath,
    coverLetterPath: input.coverLetterPath,
    jobContext: input.jobContext,
    dryRun: input.dryRun,
  };

  switch (input.platform) {
    case "greenhouse": return applyGreenhouse(common);
    case "lever":      return applyLever(common);
    case "workday":    return applyWorkday(common);
    default:           return applyGeneric(common);
  }
}
