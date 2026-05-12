"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthApi } from "@/hooks/api/useAuthApi";
import { getAuthToken } from "@/lib/api/client";
import { useTranslation } from "@/i18n/useTranslation";

export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login, loading, error, clearError } = useAuthApi();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      router.replace("/dashboard");
      return;
    }
    setRedirecting(false);
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch {
      /* error surfaced via hook */
    }
  }

  if (redirecting) return null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          {t("form.label.email")}
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          {t("auth.password")}
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("auth.signingIn") : t("auth.signIn")}
      </Button>
    </form>
  );
}
