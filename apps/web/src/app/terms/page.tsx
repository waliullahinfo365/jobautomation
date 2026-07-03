import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using the NewJob Guru job search automation platform.",
  alternates: { canonical: "https://www.newjob.guru/terms" },
};

const LAST_UPDATED = "July 3, 2026";

export default function TermsOfServicePage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of NewJob Guru at{" "}
        <a href="https://www.newjob.guru">https://www.newjob.guru</a> and related services (the &quot;Service&quot;).
        By creating an account or using the Service, you agree to these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        NewJob Guru helps job seekers track applications, automate workflows, and use AI-assisted tools for documents
        and communications. Features may include Gmail intake, Google Drive folder automation, calendar scheduling, and
        third-party AI generation. We may change, suspend, or discontinue features with reasonable notice where
        practicable.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 16 years old and able to form a binding contract. You are responsible for ensuring your use
        complies with laws in your jurisdiction and with the terms of any third-party platforms you connect (including
        Google and LinkedIn).
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>You must provide accurate registration information and keep credentials secure.</li>
        <li>You are responsible for activity under your account and workspace.</li>
        <li>Notify us promptly at <a href="mailto:info@benjaminkueper.com">info@benjaminkueper.com</a> if you suspect unauthorized access.</li>
      </ul>

      <h2>4. Connected accounts</h2>
      <p>
        When you connect Gmail, Google Drive, Google Calendar, or other integrations, you authorize us to access those
        services on your behalf within the scopes you approve. You remain the owner of your Google data; files created
        through the Service are created in your connected Google account unless otherwise stated. You may disconnect
        integrations at any time in Settings.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for unlawful, fraudulent, or harmful purposes</li>
        <li>Violate third-party terms (including Google API Services User Data Policy)</li>
        <li>Attempt to bypass security, access other users&apos; data, or abuse rate limits</li>
        <li>Upload malware or content that infringes others&apos; rights</li>
        <li>Use the Service to send spam or unsolicited bulk messages</li>
      </ul>

      <h2>6. AI-generated content</h2>
      <p>
        AI outputs (cover letters, summaries, research) are provided as assistance only. You are responsible for
        reviewing, editing, and submitting accurate materials. We do not guarantee interviews, offers, or hiring
        outcomes.
      </p>

      <h2>7. Subscriptions and payments</h2>
      <p>
        Paid plans, trials, and billing are described on our pricing page. Fees are charged according to the plan you
        select. You may cancel according to the cancellation terms shown at checkout or in your billing settings. Refunds
        are handled per our billing policy unless required otherwise by law.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        We own the Service, software, branding, and documentation. You retain ownership of content you upload or create.
        You grant us a limited license to host, process, and display your content solely to operate the Service.
      </p>

      <h2>9. Disclaimer</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
        IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT
        UNINTERRUPTED OR ERROR-FREE OPERATION.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEWJOB GURU AND ITS OPERATORS SHALL NOT BE LIABLE FOR INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL. OUR TOTAL
        LIABILITY FOR ANY CLAIM ARISING FROM THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12)
        MONTHS BEFORE THE CLAIM, OR ONE HUNDRED US DOLLARS (USD $100), WHICHEVER IS GREATER.
      </p>

      <h2>11. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate access if you breach these Terms or if
        required for security or legal reasons. Upon termination, your right to use the Service ends; provisions that by
        nature should survive (e.g. disclaimers, liability limits) will survive.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws applicable in the operator&apos;s place of business, without regard to
        conflict-of-law rules. Disputes shall be resolved in the courts of that jurisdiction unless mandatory consumer
        protection laws in your country require otherwise.
      </p>

      <h2>13. Changes</h2>
      <p>
        We may update these Terms. Continued use after the effective date constitutes acceptance. If changes are
        material, we will provide notice via the Service or email.
      </p>

      <h2>14. Contact</h2>
      <p>
        Email: <a href="mailto:info@benjaminkueper.com">info@benjaminkueper.com</a>
        <br />
        Website: <a href="https://www.newjob.guru">https://www.newjob.guru</a>
      </p>
    </LegalPageShell>
  );
}
