import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { LoginBackground } from "@/components/auth/LoginBackground";
import { LoginForm } from "@/components/auth/LoginForm";
import { ZapIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <>
      <LoginBackground />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <ZapIcon size={24} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>

          <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <LoginForm />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
