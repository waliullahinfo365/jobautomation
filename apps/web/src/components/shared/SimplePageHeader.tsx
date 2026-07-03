import { cn } from "@/lib/utils";

export function SimplePageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0 flex-1 space-y-1">
        <h1 className="text-[26px] font-bold leading-[1.12] tracking-[-0.03em] text-[var(--text-1)] sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="text-[14px] leading-relaxed text-[var(--text-3)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
