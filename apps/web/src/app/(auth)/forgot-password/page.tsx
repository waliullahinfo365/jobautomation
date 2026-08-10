import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginBackground } from "@/components/auth/LoginBackground";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { BrandIcon } from "@/components/auth/BrandIcon";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <LoginBackground />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-sm space-y-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <BrandIcon size={40} />
            <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
          </div>
          <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
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
