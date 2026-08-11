"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

export function JobDetailPrepareStickyBar({ jobId }: { jobId: string }) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "fixed inset-x-0 border-t border-[var(--border-default)] bg-[var(--surface-1)]/95 p-3 backdrop-blur-md md:hidden",
        "mobile-sticky-above-nav"
      )}
    >
      <Link
        href={`/jobs/${jobId}/apply`}
        className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#7B8EFF] to-[#4D63E0] px-4 text-[16px] font-semibold text-white shadow-sm hover:from-[#8A9BFF] hover:to-[#5A72E8]"
      >
        {t("labels.prepare")}
      </Link>
    </div>
  );
}
