import { SimplePageShell } from "./SimplePageShell";
import { SkeletonBlock, SkeletonCard, SkeletonLine } from "./Skeleton";

export function TodayPageSkeleton() {
  return (
    <SimplePageShell className="space-y-6">
      <div className="space-y-2">
        <SkeletonLine className="h-4 w-24" />
        <SkeletonBlock className="h-9 w-4/5" />
        <SkeletonLine className="h-4 w-full" />
      </div>
      <SkeletonBlock className="h-24 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-2.5">
        <SkeletonBlock className="h-[88px] rounded-2xl" />
        <SkeletonBlock className="h-[88px] rounded-2xl" />
        <SkeletonBlock className="h-[88px] rounded-2xl" />
      </div>
      <SkeletonBlock className="h-[52px] w-full rounded-2xl" />
      <SkeletonBlock className="h-12 w-full rounded-2xl" />
    </SimplePageShell>
  );
}

export function CustomerListPageSkeleton({ withTabs = true }: { withTabs?: boolean }) {
  return (
    <SimplePageShell className="space-y-5">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-2/5" />
        <SkeletonLine className="w-3/4" />
      </div>
      {withTabs ? <SkeletonBlock className="h-11 w-full rounded-2xl" /> : null}
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </SimplePageShell>
  );
}

export function CustomerSettingsSkeleton() {
  return (
    <SimplePageShell className="space-y-5">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-1/3" />
        <SkeletonLine className="w-1/2" />
      </div>
      <SkeletonBlock className="h-12 w-full rounded-2xl" />
      <SkeletonBlock className="h-40 w-full rounded-2xl" />
      <SkeletonBlock className="h-40 w-full rounded-2xl" />
    </SimplePageShell>
  );
}
