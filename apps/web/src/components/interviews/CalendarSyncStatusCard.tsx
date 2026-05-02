import { Button } from "@/components/ui/button";
import { MotionCard } from "@/components/shared/MotionCard";
import { formatDate } from "@/lib/utils";
import type { CalendarSyncStatus } from "@/types/interview";

export function CalendarSyncStatusCard({ status }: { status: CalendarSyncStatus }) {
  return (
    <MotionCard className="hover-lift p-4">
      <h3 className="text-sm font-semibold text-foreground">Calendar Sync Status</h3>
      <div className="mt-3 space-y-2 text-sm">
        <p className="text-muted-foreground">Google Calendar: <span className="font-medium text-foreground">{status.googleCalendar}</span></p>
        <p className="text-muted-foreground">Last sync: <span className="font-medium text-foreground">{formatDate(status.lastSync, "MMM d, yyyy HH:mm")}</span></p>
        <p className="text-muted-foreground">Next sync: <span className="font-medium text-foreground">{formatDate(status.nextSync, "MMM d, yyyy HH:mm")}</span></p>
      </div>
      <Button className="mt-4 w-full" variant="outline">
        Sync Now
      </Button>
    </MotionCard>
  );
}
