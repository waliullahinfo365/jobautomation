import type { Metadata } from "next";
import { Suspense } from "react";
import { APP_NAME } from "@/lib/constants";
import { LoginBackground } from "@/components/auth/LoginBackground";
import { LoginFooterCopy, LoginHeaderCopy } from "@/components/auth/AuthPageCopy";
import { AuthLegalNotice } from "@/components/auth/AuthLegalNotice";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandIcon } from "@/components/auth/BrandIcon";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <>
      <LoginBackground />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-sm space-y-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <BrandIcon size={40} />
            <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
            <LoginHeaderCopy />
          </div>

          <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>

          <AuthLegalNotice />
          <LoginFooterCopy />
        </div>
      </main>
    </>
  );
}
