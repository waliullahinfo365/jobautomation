"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Tab = "cookies" | "credentials";

type Props = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmitCredentials: (email: string, password: string) => Promise<void>;
  onSubmitCookies: (cookieJson: string) => Promise<void>;
};

export function LinkedInLoginModal({ open, loading, onClose, onSubmitCredentials, onSubmitCookies }: Props) {
  const [tab, setTab] = useState<Tab>("cookies");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cookieJson, setCookieJson] = useState("");

  if (!open) return null;

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    await onSubmitCredentials(email.trim(), password);
  }

  async function handleCookies(e: React.FormEvent) {
    e.preventDefault();
    if (!cookieJson.trim()) return;
    await onSubmitCookies(cookieJson.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg rounded-lg border bg-background shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold">Connect LinkedIn</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b text-sm">
          <button
            onClick={() => setTab("cookies")}
            className={`flex-1 py-3 font-medium transition-colors ${
              tab === "cookies"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Import from Browser ✓ Recommended
          </button>
          <button
            onClick={() => setTab("credentials")}
            className={`flex-1 py-3 font-medium transition-colors ${
              tab === "credentials"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Email & Password
          </button>
        </div>

        {/* Cookie import tab */}
        {tab === "cookies" && (
          <form onSubmit={(e) => void handleCookies(e)} className="px-6 py-5 space-y-5">
            <div className="space-y-3 text-sm">
              <p className="font-medium">Follow these 4 steps — takes about 2 minutes:</p>

              <ol className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                  <span>
                    Install the free{" "}
                    <strong className="text-foreground">Cookie-Editor</strong> Chrome extension —
                    search "Cookie-Editor" in the Chrome Web Store (by cgagnier, 300 k+ users).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                  <span>
                    Go to{" "}
                    <strong className="text-foreground">linkedin.com</strong> and make sure you are
                    logged in.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                  <span>
                    Click the Cookie-Editor icon in your toolbar → click{" "}
                    <strong className="text-foreground">Export</strong> →{" "}
                    <strong className="text-foreground">Export as JSON</strong>. This copies the
                    cookies to your clipboard.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                  <span>
                    Paste the copied JSON into the box below and click{" "}
                    <strong className="text-foreground">Import Session</strong>.
                  </span>
                </li>
              </ol>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="cookie-json">
                Paste cookie JSON here
              </label>
              <textarea
                id="cookie-json"
                rows={5}
                placeholder='[{"name":"li_at","value":"...","domain":".linkedin.com",...}]'
                value={cookieJson}
                onChange={(e) => setCookieJson(e.target.value)}
                disabled={loading}
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Your cookies are encrypted (AES-256) and stored only in your workspace database.
              They are never sent to any third party.
            </p>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !cookieJson.trim()}>
                {loading ? "Importing…" : "Import Session"}
              </Button>
            </div>
          </form>
        )}

        {/* Credentials tab */}
        {tab === "credentials" && (
          <form onSubmit={(e) => void handleCredentials(e)} className="px-6 py-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your LinkedIn credentials. The system will log in on your behalf using a
              headless browser. This may be blocked if LinkedIn detects a cloud server IP — use
              the <strong>Import from Browser</strong> tab if this fails.
            </p>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="li-email">LinkedIn Email</label>
              <Input
                id="li-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="li-password">Password</label>
              <Input
                id="li-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
              />
            </div>

            <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
              <strong>Note:</strong> If LinkedIn shows a verification challenge, disable 2FA and
              try again — or switch to the <strong>Import from Browser</strong> tab.
            </p>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !email || !password}>
                {loading ? "Connecting…" : "Connect LinkedIn"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
