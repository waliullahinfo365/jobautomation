import type { ComponentType, ReactNode } from "react";
import type { IconProps } from "@/components/icons";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  eyebrow?: string;
  /** Renders a 28×28 tile matching `.jf-panel-title-icon` (accent surface + ring). */
  icon?: ComponentType<IconProps>;
}

export function PageHeader({ title, description, actions, className, eyebrow, icon: Icon }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "gradient-border flex flex-col gap-4 p-5 md:p-6 lg:flex-row lg:items-start lg:justify-between",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-[var(--accent-ring)] bg-[var(--accent-bg)] text-[var(--accent-hi)]"
              aria-hidden
            >
              <Icon size={18} />
            </div>
          ) : null}
          <div className="min-w-0 flex-1 space-y-1.5">
            {eyebrow ? (
              <span className="inline-flex rounded-full border border-[var(--accent-ring)] bg-[var(--accent-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-hi)]">
                {eyebrow}
              </span>
            ) : null}
            <h1 className="font-display text-[26px] font-bold tracking-[-0.02em] text-[var(--text-1)] lg:text-[30px]">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-[13px] leading-relaxed text-[var(--text-3)] lg:text-sm">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
