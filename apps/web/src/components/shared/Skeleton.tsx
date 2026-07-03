import { cn } from "@/lib/utils";

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-[var(--surface-3)]/80", className)}
      aria-hidden
    />
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <SkeletonBlock className={cn("h-3", className)} />;
}

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
      <SkeletonLine className="h-4 w-2/5" />
      <SkeletonLine className="mt-3 h-3 w-4/5" />
      {lines > 2 ? <SkeletonLine className="mt-2 h-3 w-3/5" /> : null}
      <div className="mt-4 flex gap-2">
        <SkeletonBlock className="h-10 flex-1 rounded-xl" />
        <SkeletonBlock className="h-10 w-20 rounded-xl" />
      </div>
    </div>
  );
}
