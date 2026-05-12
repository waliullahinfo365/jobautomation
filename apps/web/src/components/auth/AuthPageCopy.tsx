"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";

export function LoginHeaderCopy() {
  const { t } = useTranslation();
  return <p className="text-sm text-muted-foreground">{t("auth.signInToAccount")}</p>;
}

export function LoginFooterCopy() {
  const { t } = useTranslation();
  return (
    <p className="text-center text-xs text-muted-foreground">
      {t("auth.noAccount")}{" "}
      <Link href="/register" className="text-primary hover:underline">
        {t("auth.signUp")}
      </Link>
    </p>
  );
}

export function RegisterHeaderCopy() {
  const { t } = useTranslation();
  return <p className="text-sm text-muted-foreground">{t("auth.createWorkspace")}</p>;
}

export function RegisterFooterCopy() {
  const { t } = useTranslation();
  return (
    <p className="text-center text-xs text-muted-foreground">
      {t("auth.alreadyHaveAccount")}{" "}
      <Link href="/login" className="text-primary hover:underline">
        {t("auth.signIn")}
      </Link>
    </p>
  );
}
