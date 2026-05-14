"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthApi } from "@/hooks/api/useAuthApi";
import { getAuthToken, setAuthToken } from "@/lib/api/client";
import { getGoogleLoginUrl } from "@/lib/api/auth.api";
import { useTranslation } from "@/i18n/useTranslation";
import { showError } from "@/lib/ui/toast";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.583c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.167 6.656 3.583 9 3.583Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading, error, clearError } = useAuthApi();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle already-authenticated and Google callback token
  useEffect(() => {
    // Google OAuth callback: ?token=...&tenantId=...&userId=...
    const token = searchParams.get("token");
    const tenantId = searchParams.get("tenantId");
    const userId = searchParams.get("userId");
    const googleErr = searchParams.get("google_error");

    if (googleErr) {
      setGoogleError(decodeURIComponent(googleErr));
      setRedirecting(false);
      router.replace("/login");
      return;
    }

    if (searchParams.get("reset") === "1") {
      setSuccessMsg(t("auth.passwordResetSuccess"));
      router.replace("/login");
    }

    if (token && tenantId && userId) {
      setAuthToken(token);
      try {
        localStorage.setItem("tenantId", tenantId);
        localStorage.setItem("userId", userId);
      } catch {
        /* ignore */
      }
      router.replace("/dashboard");
      return;
    }

    if (getAuthToken()) {
      router.replace("/dashboard");
      return;
    }

    setRedirecting(false);
  }, [router, searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setGoogleError(null);
    try {
      await login(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch {
      /* error surfaced via hook */
    }
  }

  async function onGoogleSignIn() {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const result = await getGoogleLoginUrl();
      if (!result.oauthEnabled || !result.authorizationUrl) {
        setGoogleError(result.message ?? t("auth.googleSignInNotConfigured"));
        return;
      }
      window.location.href = result.authorizationUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("auth.googleSignInNotConfigured");
      setGoogleError(msg);
      showError(msg);
    } finally {
      setGoogleLoading(false);
    }
  }

  if (redirecting) return null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {successMsg && (
        <p className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
          {successMsg}
        </p>
      )}
      {(error || googleError) ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error ?? googleError}
        </p>
      ) : null}

      {/* Google sign-in */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-2"
        onClick={onGoogleSignIn}
        disabled={googleLoading || loading}
      >
        {googleLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <GoogleIcon />
        )}
        {googleLoading ? t("auth.startingGoogleSignIn") : t("auth.continueWithGoogle")}
      </Button>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{t("auth.orDivider")}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Email */}
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
          className="h-11"
        />
      </div>

      {/* Password with eye toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" htmlFor="password">
            {t("auth.password")}
          </label>
          <a href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
            {t("auth.forgotPassword")}
          </a>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
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
            tabIndex={0}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading || googleLoading}>
        {loading ? t("auth.signingIn") : t("auth.signIn")}
      </Button>
    </form>
  );
}
