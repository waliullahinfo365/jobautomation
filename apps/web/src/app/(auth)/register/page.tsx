import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";
import { RegisterFooterCopy, RegisterHeaderCopy } from "@/components/auth/AuthPageCopy";
import { AuthLegalNotice } from "@/components/auth/AuthLegalNotice";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { BrandIcon } from "@/components/auth/BrandIcon";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <BrandIcon size={40} />
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          <RegisterHeaderCopy />
        </div>

        <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
          <RegisterForm />
        </div>

        <AuthLegalNotice />
        <RegisterFooterCopy />
      </div>
    </div>
  );
}
