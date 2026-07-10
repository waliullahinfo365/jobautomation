/** Cloud LinkedIn Playwright auto-apply (Railway). Off by default — use Apply Assistant on mobile. */
export function isLinkedInCloudAutoApplyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_LINKEDIN_CLOUD_AUTO_APPLY_ENABLED === "true";
}
