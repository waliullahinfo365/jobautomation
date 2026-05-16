"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
};

export function LinkedInLoginModal({ open, loading, onClose, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    await onSubmit(email.trim(), password);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Connect LinkedIn</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your LinkedIn credentials. They are used once to create a browser session and are
          never stored — only the session cookie is saved.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="li-email">
              LinkedIn Email
            </label>
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
            <label className="text-sm font-medium" htmlFor="li-password">
              Password
            </label>
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
            <strong>Note:</strong> If your account has two-factor authentication enabled, the
            automated login may be blocked by LinkedIn. In that case, disable 2FA temporarily or
            use an app password.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !email || !password}>
              {loading ? "Connecting…" : "Connect LinkedIn"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
