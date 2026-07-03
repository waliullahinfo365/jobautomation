import type { ReactNode } from "react";
import Link from "next/link";
import { FileTextIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type EmptyStateCta = {
  label: string;
  onClick?: () => void;
  href?: string;
};

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Primary action — gradient button on customer pages. */
  cta?: EmptyStateCta;
  /** @deprecated Prefer a single `cta` for customer pages. */
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

function EmptyStatePrimaryCta({ cta }: { cta: EmptyStateCta }) {
  if (!cta.href && !cta.onClick) return null;

  const className =
    "inline-flex min-h-[48px] w-full max-w-xs items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-b from-[#7B8EFF] to-[#4D63E0] px-5 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(99,124,255,0.45)] transition-opacity hover:from-[#8A9BFF] hover:to-[#5A72E8]";

  if (cta.href) {
    return (
      <Link href={cta.href} className={className} onClick={cta.onClick}>
        {cta.label}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={cta.onClick}>
      {cta.label}
    </button>
  );
}

export function EmptyState({ title, description, icon, cta, action, actionLabel, onAction, className, compact }: EmptyStateProps) {
  const resolvedAction = action ?? (actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null);
  return (
    <div
      className={cn(
        "jf-empty mobile-state-card animate-fade-in flex w-full min-w-0 flex-col items-center justify-center rounded-2xl text-center",
        compact ? "min-h-[min(36vh,280px)] py-8" : "min-h-[min(48vh,380px)]",
        className
      )}
    >
      <div className="jf-empty-icon">{icon ?? <FileTextIcon size={22} className="text-[var(--accent-hi)]" />}</div>
      <div className="jf-empty-title text-[17px] sm:text-[18px]">{title}</div>
      {description ? <p className="jf-empty-sub max-w-sm text-[14px] leading-relaxed">{description}</p> : null}
      {cta && (cta.href || cta.onClick) ? (
        <div className="mt-4 w-full px-4">
          <EmptyStatePrimaryCta cta={cta} />
        </div>
      ) : null}
      {resolvedAction && !(cta && (cta.href || cta.onClick)) ? (
        <div className="mt-3 w-full max-w-xs px-2 [&_button]:min-h-[44px] [&_button]:w-full">{resolvedAction}</div>
      ) : null}
    </div>
  );
}
