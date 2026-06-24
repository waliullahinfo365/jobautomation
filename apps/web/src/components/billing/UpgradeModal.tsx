"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export type PaywallReason =
  | "job_limit"
  | "ai_credits"
  | "apply_assistant"
  | "reply_detection"
  | "export"
  | "jobcenter_report";

const COPY: Record<PaywallReason, { title: string; description: string; cta: string; secondaryCta?: string }> = {
  job_limit: {
    title: "Job limit reached",
    description: "You have reached the limit of your current plan. Upgrade to continue tracking more jobs.",
    cta: "Upgrade Plan",
  },
  ai_credits: {
    title: "AI credits used up",
    description:
      "You have used all AI credits for this month. Upgrade your plan or buy extra credits to continue generating documents.",
    cta: "Upgrade Plan",
    secondaryCta: "Buy Extra Credits",
  },
  apply_assistant: {
    title: "Unlock Apply Assistant",
    description:
      "Apply Assistant is available on Plus, Pro, and Executive plans. Upgrade to generate tailored application documents and apply faster.",
    cta: "Unlock Apply Assistant",
  },
  reply_detection: {
    title: "Upgrade to Pro",
    description: "Reply Detection helps you identify recruiter responses automatically. Upgrade to manage replies and follow-ups in one place.",
    cta: "Upgrade to Pro",
  },
  export: {
    title: "Upgrade to Pro",
    description:
      "Exports are available on Pro and Executive plans. Upgrade to download reports, application summaries, and job search records.",
    cta: "Upgrade to Pro",
  },
  jobcenter_report: {
    title: "Upgrade to Pro",
    description:
      "Job search reports are available on Pro and Executive plans. Upgrade to export your application activity for employment agencies or advisors.",
    cta: "Upgrade to Pro",
  },
};

type UpgradeModalProps = {
  open: boolean;
  reason: PaywallReason;
  onClose: () => void;
};

export function UpgradeModal({ open, reason, onClose }: UpgradeModalProps) {
  if (!open) return null;
  const copy = COPY[reason];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-50 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-[var(--text-1)]">{copy.title}</h2>
        <p className="mt-2 text-sm text-[var(--text-3)]">{copy.description}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/pricing" onClick={onClose}>
            <Button className="w-full">{copy.cta}</Button>
          </Link>
          {copy.secondaryCta ? (
            <Link href="/pricing" onClick={onClose}>
              <Button variant="outline" className="w-full">{copy.secondaryCta}</Button>
            </Link>
          ) : null}
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
