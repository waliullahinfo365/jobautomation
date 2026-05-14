"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/api/auth.api";
import { useTranslation } from "@/i18n/useTranslation";

export function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">Invalid or missing reset token.</p>
        <a href="/forgot-password" className="block text-sm font-medium hover:underline">
          Request a new link
        </a>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError(t("auth.passwordsDoNotMatch"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      router.replace("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t("auth.resetPassword")}</h2>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          {t("auth.newPassword")}
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-r-md"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="confirm">
          {t("auth.confirmNewPassword")}
        </label>
        <Input
          id="confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          className="h-11"
        />
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? t("auth.resettingPassword") : t("auth.resetPassword")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        <a href="/login" className="hover:underline">{t("auth.backToSignIn")}</a>
      </p>
    </form>
  );
}
