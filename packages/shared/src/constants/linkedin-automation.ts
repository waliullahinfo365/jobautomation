/**
 * LinkedIn cloud automation (Railway Playwright) is disabled by default.
 * Mobile users apply via Apply Assistant; desktop auto-apply can be re-enabled with env flag.
 */
export function isLinkedInCloudAutoApplyEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.LINKEDIN_CLOUD_AUTO_APPLY_ENABLED === "true";
}
