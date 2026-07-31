/**
 * Legacy / replaced integrations. Off by default so Settings stays simple:
 * Unipile + Apply Assistant + Calendar + Claude + Resend/Telegram/Slack.
 * Opt back in only with explicit env flags.
 */

export function isGoogleDriveEnabled(): boolean {
  return (
    process.env.GOOGLE_DRIVE_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_ENABLED === "true"
  );
}

/** Direct Google Gmail OAuth connect (not Unipile). */
export function isLegacyGmailOauthEnabled(): boolean {
  return (
    process.env.LEGACY_GMAIL_OAUTH_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_LEGACY_GMAIL_OAUTH_ENABLED === "true"
  );
}

export function isLegacySmtpEnabled(): boolean {
  return (
    process.env.LEGACY_SMTP_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_LEGACY_SMTP_ENABLED === "true"
  );
}

export function isNotionLegacyEnabled(): boolean {
  return (
    process.env.NOTION_LEGACY_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_NOTION_LEGACY_ENABLED === "true"
  );
}

export function isLinkedInCloudAutoApplyEnabled(): boolean {
  return (
    process.env.LINKEDIN_CLOUD_AUTO_APPLY_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_LINKEDIN_CLOUD_AUTO_APPLY_ENABLED === "true"
  );
}

/** Product Settings catalog — hide replaced integrations unless flagged on. */
export function isIntegrationSlugVisible(slug: string): boolean {
  switch (slug) {
    case "gmail":
      return isLegacyGmailOauthEnabled();
    case "google-drive":
      return isGoogleDriveEnabled();
    case "smtp":
      return isLegacySmtpEnabled();
    case "notion-legacy":
      return isNotionLegacyEnabled();
    case "linkedin":
      return isLinkedInCloudAutoApplyEnabled();
    default:
      return true;
  }
}
