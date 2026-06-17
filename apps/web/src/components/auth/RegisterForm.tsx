"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthApi } from "@/hooks/api/useAuthApi";
import { getAuthToken } from "@/lib/api/client";
import { useTranslation } from "@/i18n/useTranslation";

export function RegisterForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const { register, loading, error, clearError } = useAuthApi();
  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      router.replace("/today");
      return;
    }
    setRedirecting(false);
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await register({ name, email, password, workspaceName });
      router.push("/today");
      router.refresh();
    } catch {
      /* surfaced via hook */
    }
  }

  if (redirecting) return null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="name">
          {t("auth.fullName")}
        </label>
        <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="workspace">
          {t("form.label.workspaceName")}
        </label>
        <Input
          id="workspace"
          placeholder="Acme Job Search"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          required
        />
      </div>
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
          autoComplete="new-password"
          placeholder={t("form.helper.passwordMinLength")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
      </Button>
    </form>
  );
}
