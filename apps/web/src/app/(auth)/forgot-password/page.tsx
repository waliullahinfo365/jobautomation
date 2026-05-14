import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginBackground } from "@/components/auth/LoginBackground";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ZapIcon } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <LoginBackground />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <ZapIcon size={24} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
          </div>
          <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <Suspense>
              <ForgotPasswordForm />
            </Suspense>
          </div>
          <p className="text-center text-xs text-zinc-300">
            <a href="/login" className="text-white font-medium hover:underline">← Back to sign in</a>
          </p>
        </div>
      </main>
    </>
  );
}
