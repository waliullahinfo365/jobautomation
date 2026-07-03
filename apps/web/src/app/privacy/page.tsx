import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How NewJob Guru collects, uses, and protects your data — including Google Gmail and Drive integrations.",
  alternates: { canonical: "https://www.newjob.guru/privacy" },
};

const LAST_UPDATED = "July 3, 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        NewJob Guru (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the job search automation platform at{" "}
        <a href="https://www.newjob.guru">https://www.newjob.guru</a>. This Privacy Policy explains what information we
        collect, how we use it, and your choices. By using our service, you agree to this policy.
      </p>

      <h2>1. Who we are</h2>
      <p>
        NewJob Guru is an AI-powered job application automation platform. Our API is served at{" "}
        <a href="https://api.newjob.guru">https://api.newjob.guru</a>. For privacy-related requests, contact{" "}
        <a href="mailto:info@benjaminkueper.com">info@benjaminkueper.com</a>.
      </p>

      <h2>2. Information we collect</h2>
      <h3>Account information</h3>
      <ul>
        <li>Name, email address, and password (or Google sign-in profile data)</li>
        <li>Workspace/tenant settings and subscription/billing status</li>
      </ul>
      <h3>Job search data you provide or generate</h3>
      <ul>
        <li>Job applications, contacts, interviews, documents (CVs, cover letters), notes, and pipeline status</li>
        <li>Automation logs and activity within your workspace</li>
      </ul>
      <h3>Google integrations (when you connect them)</h3>
      <p>
        If you choose to connect Google services in Settings, we request OAuth access only for the scopes shown on the
        Google consent screen. Depending on what you connect, this may include:
      </p>
      <ul>
        <li>
          <strong>Gmail</strong> — read and process job-related emails to import opportunities, detect replies, and
          support follow-up workflows. We access only the mail needed for features you enable.
        </li>
        <li>
          <strong>Google Drive &amp; Google Docs</strong> — create and organize folders and documents (e.g. job folders,
          cover letters, research briefs, exports) in <em>your</em> connected Google account.
        </li>
        <li>
          <strong>Google Calendar</strong> — create or sync interview and deadline events when you use scheduling
          features.
        </li>
      </ul>
      <p>
        We store encrypted OAuth tokens per workspace to perform these actions on your behalf. We do not sell your Google
        data. We do not use Gmail or Drive data for advertising.
      </p>
      <h3>Technical data</h3>
      <ul>
        <li>IP address, browser type, device information, and usage logs for security and reliability</li>
        <li>Cookies and similar technologies (see our <a href="/cookies">Cookie Policy</a>)</li>
      </ul>

      <h2>3. How we use your information</h2>
      <ul>
        <li>Provide, maintain, and improve the NewJob Guru platform</li>
        <li>Run automations you enable (job intake, document generation, reminders, reports)</li>
        <li>Authenticate you and secure your account</li>
        <li>Process payments through our payment provider (e.g. Stripe) when applicable</li>
        <li>Send service-related emails (account, security, product updates)</li>
        <li>Comply with legal obligations and prevent abuse</li>
      </ul>

      <h2>4. AI processing</h2>
      <p>
        Some features use third-party AI providers (e.g. Anthropic Claude) to generate or analyze text such as cover
        letters and job summaries. We send only the content required for the feature you request. Do not submit
        information you are not allowed to share with subprocessors under your own agreements.
      </p>

      <h2>5. How we share information</h2>
      <p>We do not sell your personal information. We may share data with:</p>
      <ul>
        <li>
          <strong>Service providers</strong> — hosting (e.g. Railway, Vercel), database (MongoDB Atlas), email delivery,
          analytics, and AI APIs, under contracts that limit use to providing our service
        </li>
        <li>
          <strong>Google</strong> — when you connect Google integrations, as described above and per Google&apos;s API
          Services User Data Policy
        </li>
        <li>
          <strong>Legal requirements</strong> — if required by law or to protect rights, safety, and security
        </li>
      </ul>

      <h2>6. Data retention</h2>
      <p>
        We retain your data while your account is active and as needed to provide the service. You may request deletion
        of your account and associated workspace data by contacting us. OAuth tokens are removed when you disconnect an
        integration or delete your account.
      </p>

      <h2>7. Security</h2>
      <p>
        We use industry-standard measures including encryption in transit (HTTPS), encrypted storage of integration
        tokens, and access controls. No method of transmission or storage is 100% secure; please use a strong password
        and protect your account credentials.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Depending on your location (including the EU/EEA under GDPR), you may have rights to access, correct, delete,
        restrict, or port your personal data, and to object to certain processing. To exercise these rights, email{" "}
        <a href="mailto:info@benjaminkueper.com">info@benjaminkueper.com</a>. You may also revoke Google access at any
        time via <a href="https://myaccount.google.com/permissions">Google Account permissions</a> or by disconnecting
        in NewJob Guru Settings.
      </p>

      <h2>9. International transfers</h2>
      <p>
        Your data may be processed in countries where our providers operate. We take steps to ensure appropriate
        safeguards where required by law.
      </p>

      <h2>10. Children</h2>
      <p>NewJob Guru is not intended for users under 16. We do not knowingly collect data from children.</p>

      <h2>11. Changes</h2>
      <p>
        We may update this policy from time to time. We will post the new version on this page and update the &quot;Last
        updated&quot; date. Material changes may be communicated by email or in-app notice.
      </p>

      <h2>12. Contact</h2>
      <p>
        Email: <a href="mailto:info@benjaminkueper.com">info@benjaminkueper.com</a>
        <br />
        Website: <a href="https://www.newjob.guru">https://www.newjob.guru</a>
      </p>
    </LegalPageShell>
  );
}
