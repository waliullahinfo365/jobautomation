/**
 * Playwright job application automation — public exports.
 */

export { saveSession, loadSession, hasSession, deleteSession, captureAndSaveSession } from "./session-store";
export type { ApplyPlatform } from "./session-store";
export { launchBrowser, detectPlatform, humanDelay, humanType } from "./browser";
export { fillFormPage, extractFormFields, uploadFile } from "./form-filler";
export type { UserProfile, FormField, FillInstruction, FormFillResult } from "./form-filler";
export { applyViaLinkedIn } from "./appliers/linkedin";
export { applyViaIndeed } from "./appliers/indeed";
export { applyViaExternal } from "./appliers/external";

import { launchBrowser, detectPlatform, humanDelay } from "./browser";
import { loadSession, captureAndSaveSession } from "./session-store";
import { applyViaLinkedIn } from "./appliers/linkedin";
import { applyViaIndeed } from "./appliers/indeed";
import { applyViaExternal } from "./appliers/external";
import type { ApplyPlatform } from "./session-store";
import type { UserProfile } from "./form-filler";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";

export interface RunApplyInput {
  tenantId: string;
  jobId: string;
  jobUrl: string;
  platform?: ApplyPlatform;
  profile: UserProfile;
  company: string;
  position: string;
  cvUrl?: string;
  coverLetterUrl?: string;
  additionalContext?: string;
  dryRun?: boolean;
}

export interface RunApplyResult {
  success: boolean;
  message: string;
  platform: ApplyPlatform;
  stepsCompleted: number;
  sessionExpired?: boolean;
}

/** Download a file from a URL to a temp path and return the path */
async function downloadToTemp(url: string, ext = ".pdf"): Promise<string | undefined> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return undefined;
    const buf = await resp.arrayBuffer();
    const tmpPath = path.join(os.tmpdir(), `jobapply-${Date.now()}${ext}`);
    fs.writeFileSync(tmpPath, Buffer.from(buf));
    return tmpPath;
  } catch {
    return undefined;
  }
}

/** Clean up temp files */
function cleanupTemp(paths: Array<string | undefined>): void {
  for (const p of paths) {
    if (p) fs.unlink(p, () => void 0);
  }
}

/**
 * Main entry point for the apply worker.
 *
 * - Loads saved session from MongoDB
 * - Launches headless browser with that session
 * - Delegates to the right platform applier
 * - Returns result
 */
export async function runApply(input: RunApplyInput): Promise<RunApplyResult> {
  const platform = input.platform ?? detectPlatform(input.jobUrl);

  // Load session
  const storageState = await loadSession({ tenantId: input.tenantId, platform });
  if (!storageState) {
    return {
      success: false,
      message: `No saved session for ${platform}. Run the save-session CLI first: pnpm save-session ${platform}`,
      platform,
      stepsCompleted: 0,
      sessionExpired: true,
    };
  }

  // Download attachments
  const cvPath = input.cvUrl ? await downloadToTemp(input.cvUrl) : undefined;
  const coverLetterPath = input.coverLetterUrl ? await downloadToTemp(input.coverLetterUrl) : undefined;

  const jobContext = {
    company: input.company,
    position: input.position,
    description: input.additionalContext,
  };

  const session = await launchBrowser({ headless: true, storageState });

  try {
    let result: RunApplyResult;

    if (platform === "linkedin") {
      const r = await applyViaLinkedIn({
        page: session.page,
        jobUrl: input.jobUrl,
        profile: input.profile,
        cvPath,
        coverLetterPath,
        jobContext,
        dryRun: input.dryRun,
      });

      // If LinkedIn redirected to external ATS, apply via that
      if (!r.success && r.appliedViaExternalUrl) {
        const extPlatform = detectPlatform(r.appliedViaExternalUrl);
        const extResult = await applyViaExternal({
          page: session.page,
          jobUrl: r.appliedViaExternalUrl,
          platform: extPlatform,
          profile: input.profile,
          cvPath,
          coverLetterPath,
          jobContext,
          dryRun: input.dryRun,
        });
        result = { ...extResult, sessionExpired: false };
      } else {
        result = {
          success: r.success,
          message: r.message,
          platform,
          stepsCompleted: r.stepsCompleted,
          sessionExpired: r.message.includes("session expired"),
        };
      }
    } else if (platform === "indeed") {
      const r = await applyViaIndeed({
        page: session.page,
        jobUrl: input.jobUrl,
        profile: input.profile,
        cvPath,
        coverLetterPath,
        jobContext,
        dryRun: input.dryRun,
      });
      result = {
        success: r.success,
        message: r.message,
        platform,
        stepsCompleted: r.stepsCompleted,
        sessionExpired: r.message.includes("session expired"),
      };
    } else {
      const r = await applyViaExternal({
        page: session.page,
        jobUrl: input.jobUrl,
        platform,
        profile: input.profile,
        cvPath,
        coverLetterPath,
        jobContext,
        dryRun: input.dryRun,
      });
      result = { ...r, sessionExpired: false };
    }

    // Refresh session cookies (keeps it alive longer)
    await captureAndSaveSession({ tenantId: input.tenantId, platform, context: session.context });

    return result;
  } finally {
    await session.close();
    cleanupTemp([cvPath, coverLetterPath]);
  }
}
