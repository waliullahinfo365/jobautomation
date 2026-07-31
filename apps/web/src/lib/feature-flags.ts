/** Cloud LinkedIn Playwright auto-apply (Railway). Off by default — use Apply Assistant on mobile. */
export function isLinkedInCloudAutoApplyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_LINKEDIN_CLOUD_AUTO_APPLY_ENABLED === "true";
}

/** Legacy Google Drive (replaced by Firebase Storage). Off by default. */
export function isGoogleDriveEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_DRIVE_ENABLED === "true";
}

/** Legacy direct Gmail OAuth (replaced by Unipile). Off by default. */
export function isLegacyGmailOauthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_LEGACY_GMAIL_OAUTH_ENABLED === "true";
}
