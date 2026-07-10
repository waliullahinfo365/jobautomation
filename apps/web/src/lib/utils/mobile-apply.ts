/** Resolve best URL to open a job posting — prefers LinkedIn app deep link on mobile. */
export function resolveMobileJobOpenUrl(jobUrl: string | null | undefined): string | null {
  const raw = (jobUrl ?? "").trim();
  if (!raw) return null;

  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const u = new URL(normalized);
    if (u.hostname.includes("linkedin.com") && u.pathname.includes("/jobs/")) {
      const match = u.pathname.match(/\/jobs\/view\/(\d+)/);
      if (match?.[1]) {
        return `https://www.linkedin.com/jobs/view/${match[1]}/`;
      }
    }
  } catch {
    return normalized;
  }

  return normalized;
}

/** Copy text to clipboard when supported. */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(trimmed);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
