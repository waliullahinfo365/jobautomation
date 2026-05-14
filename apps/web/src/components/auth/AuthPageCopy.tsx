"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";

export function LoginHeaderCopy() {
  const { t } = useTranslation();
  return <p className="text-sm text-zinc-300">{t("auth.signInToAccount")}</p>;
}

export function LoginFooterCopy() {
  const { t } = useTranslation();
  return (
    <p className="text-center text-xs text-zinc-300">
      {t("auth.noAccount")}{" "}
      <Link href="/register" className="text-white font-medium hover:underline">
        {t("auth.signUp")}
      </Link>
    </p>
  );
}

export function RegisterHeaderCopy() {
  const { t } = useTranslation();
  return <p className="text-sm text-zinc-300">{t("auth.createWorkspace")}</p>;
}

export function RegisterFooterCopy() {
  const { t } = useTranslation();
  return (
    <p className="text-center text-xs text-zinc-300">
      {t("auth.alreadyHaveAccount")}{" "}
      <Link href="/login" className="text-white font-medium hover:underline">
        {t("auth.signIn")}
      </Link>
    </p>
  );
}
