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

/** Hide replaced Settings integration cards (client-side filter; API also filters). */
export function isIntegrationSlugVisible(slug: string): boolean {
  switch (slug) {
    case "gmail":
      return isLegacyGmailOauthEnabled();
    case "google-drive":
      return isGoogleDriveEnabled();
    case "smtp":
      return process.env.NEXT_PUBLIC_LEGACY_SMTP_ENABLED === "true";
    case "notion-legacy":
      return process.env.NEXT_PUBLIC_NOTION_LEGACY_ENABLED === "true";
    case "linkedin":
      return isLinkedInCloudAutoApplyEnabled();
    default:
      return true;
  }
}
