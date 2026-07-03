import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How NewJob Guru uses cookies and similar technologies.",
  alternates: { canonical: "https://www.newjob.guru/cookies" },
};

const LAST_UPDATED = "July 3, 2026";

export default function CookiePolicyPage() {
  return (
    <LegalPageShell title="Cookie Policy" lastUpdated={LAST_UPDATED}>
      <p>
        This Cookie Policy explains how NewJob Guru (&quot;we&quot;, &quot;us&quot;) uses cookies and similar
        technologies on <a href="https://www.newjob.guru">https://www.newjob.guru</a>.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help the site remember your
        preferences, keep you signed in, and understand how the service is used.
      </p>

      <h2>2. How we use cookies</h2>
      <h3>Essential cookies</h3>
      <ul>
        <li>
          <strong>Authentication</strong> — session tokens or local storage keys so you stay logged in to your account
        </li>
        <li>
          <strong>Security</strong> — protect against cross-site request forgery and abuse
        </li>
      </ul>
      <h3>Functional cookies</h3>
      <ul>
        <li>
          <strong>Preferences</strong> — theme (light/dark), language, and UI settings
        </li>
      </ul>
      <h3>Analytics (if enabled)</h3>
      <p>
        We may use privacy-focused analytics to understand usage and improve the product. If we enable third-party
        analytics, we will update this page and, where required, request consent.
      </p>

      <h2>3. Third-party cookies</h2>
      <p>
        When you sign in with Google or connect Google integrations, Google may set cookies as part of its OAuth flow.
        Those are governed by{" "}
        <a href="https://policies.google.com/privacy">Google&apos;s Privacy Policy</a>. Payment pages may use cookies
        from our payment processor (e.g. Stripe) when you subscribe.
      </p>

      <h2>4. Your choices</h2>
      <ul>
        <li>Browser settings — most browsers let you block or delete cookies</li>
        <li>Sign out — clears session-related storage used for authentication</li>
        <li>Disconnect Google — revokes integration tokens in our service and via Google Account permissions</li>
      </ul>
      <p>Blocking essential cookies may prevent parts of the Service from working correctly.</p>

      <h2>5. Local storage</h2>
      <p>
        We may store similar data in localStorage or sessionStorage (e.g. API access tokens, demo tenant headers in
        development). This serves the same purposes as essential cookies above.
      </p>

      <h2>6. Updates</h2>
      <p>We may update this Cookie Policy. The &quot;Last updated&quot; date at the top reflects the latest version.</p>

      <h2>7. Contact</h2>
      <p>
        Questions: <a href="mailto:info@benjaminkueper.com">info@benjaminkueper.com</a>
      </p>
    </LegalPageShell>
  );
}
