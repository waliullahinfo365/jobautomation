"use client";

import Link from "next/link";
import { HealthCheckIcon, PlusIcon, SparkleIcon } from "@/components/icons";
import { ApiStatusIndicator } from "@/components/shared/ApiStatusIndicator";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardHeroProps {
  showMockIndicator: boolean;
}

export function DashboardHero({ showMockIndicator }: DashboardHeroProps) {
  return (
    <section className="jf-hero relative mb-4 sm:mb-5">
      <div className="relative z-[1] min-w-0 max-w-[760px]">
        <div className="mb-3 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-[var(--accent-ring)] bg-[var(--accent-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-hi)] sm:mb-4 sm:text-[11.5px]">
          <SparkleIcon size={12} className="shrink-0 text-[var(--accent-hi)]" />
          <span className="jf-chip-dot" />
          Live Automation Dashboard
        </div>
        <h1 className="font-display text-[22px] font-bold leading-[1.12] tracking-[-0.022em] text-[var(--text-1)] sm:text-[26px] md:text-[28px] lg:text-[30px]">
          Your application{" "}
          <em className="font-serif text-[var(--accent-hi)] not-italic">control center</em>
        </h1>
        <p className="mt-2.5 max-w-[580px] text-[13px] leading-[1.55] text-[var(--text-3)] sm:text-[14px]">
          Monitor job opportunities, application health, and automation performance in one disciplined view.
        </p>
      </div>
      <div className="relative z-[1] flex w-full min-w-0 shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
        {showMockIndicator ? (
          <div className="w-full sm:w-auto">
            <ApiStatusIndicator usingMock />
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="h-[40px] w-full justify-center border-[var(--border-default)] bg-[var(--surface-2)] text-[13px] font-semibold text-[var(--text-1)] hover:bg-[var(--surface-3)] sm:h-[38px] sm:w-auto"
        >
          <HealthCheckIcon size={16} className="mr-2" />
          Run Health Check
        </Button>
        <Link
          href="/jobs"
          className={cn(
            buttonVariants({ variant: "default", size: "default" }),
            "h-[40px] w-full justify-center bg-gradient-to-b from-[#7488FF] to-[#4D63E0] px-4 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_12px_-4px_rgba(99,124,255,0.45)] hover:from-[#8499FF] hover:to-[#5a72e8] sm:h-[38px] sm:w-auto"
          )}
        >
          <PlusIcon size={14} className="mr-2" />
          Add Job
        </Link>
      </div>
    </section>
  );
}
