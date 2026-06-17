"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { SparkleIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";
import { BRAND } from "@/lib/brand";

export function JobGuruPageClient() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SparkleIcon}
        eyebrow={BRAND.productName}
        title={t("jobGuru.title")}
        description={t("jobGuru.description")}
      />
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-2)]">
        <p>{t("jobGuru.comingSoon")}</p>
        <p className="mt-3">
          <Link href="/jobs" className="font-medium text-[var(--accent-hi)] hover:underline">
            {t("jobGuru.browseJobs")}
          </Link>
        </p>
      </div>
    </div>
  );
}
