/**
 * Validates public env for production builds. Skips when not in production.
 */

export function validateWebEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl || !/^https?:\/\//.test(apiUrl.trim())) {
    throw new Error(
      "NEXT_PUBLIC_API_URL must be set to a valid http(s) URL in production (e.g. https://api.example.com)",
    );
  }

  if (process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === "true" && !process.env.NEXT_PUBLIC_DEMO_TENANT_ID) {
    console.warn(
      "[web env] NEXT_PUBLIC_USE_MOCK_FALLBACK is true but NEXT_PUBLIC_DEMO_TENANT_ID is unset — demo flows may misbehave.",
    );
  }
}
