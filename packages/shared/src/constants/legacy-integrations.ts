/**
 * Legacy Google Drive / Gmail OAuth paths replaced by Firebase Storage + Unipile.
 * Opt back in only with explicit env flags (e.g. migration / advanced tenants).
 */
export function isGoogleDriveEnabled(): boolean {
  return (
    process.env.GOOGLE_DRIVE_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_ENABLED === "true"
  );
}

/** Direct Google Gmail OAuth connect (not Unipile). Off by default. */
export function isLegacyGmailOauthEnabled(): boolean {
  return (
    process.env.LEGACY_GMAIL_OAUTH_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_LEGACY_GMAIL_OAUTH_ENABLED === "true"
  );
}
