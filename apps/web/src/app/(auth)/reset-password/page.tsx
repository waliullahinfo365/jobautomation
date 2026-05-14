import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginBackground } from "@/components/auth/LoginBackground";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { BrandIcon } from "@/components/auth/BrandIcon";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Reset Password" };

export default function ResetPasswordPage() {
  return (
    <>
      <LoginBackground />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <BrandIcon size={40} />
            <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
          </div>
          <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <Suspense>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}
