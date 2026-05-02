import { Button } from "@/components/ui/button";
import { MotionCard } from "@/components/shared/MotionCard";
import { formatDate } from "@/lib/utils";
import type { AwaitingConfirmationInterview } from "@/types/interview";

export function AwaitingConfirmationSection({
  items,
  onConfirm,
}: {
  items: AwaitingConfirmationInterview[];
  onConfirm: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {items.map((item, index) => (
        <MotionCard key={item.id} delay={index * 0.03} className="hover-lift p-4">
          <p className="text-sm font-semibold text-foreground">{item.company}</p>
          <p className="text-xs text-muted-foreground">{item.position}</p>
          <p className="mt-2 text-xs text-muted-foreground">Proposed time: {formatDate(item.proposedTime, "MMM d, yyyy HH:mm")}</p>
          <p className="text-xs text-muted-foreground">Contact: {item.contact}</p>
          <p className="mt-2 text-xs text-foreground">{item.sourceEmailSubject}</p>
          <p className="mt-2 rounded-md bg-muted/70 p-2 text-xs text-muted-foreground">{item.aiDetectedIntent}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onConfirm(item.id)}>Confirm</Button>
            <Button size="sm" variant="secondary">Suggest New Time</Button>
            <Button size="sm" variant="ghost">Ignore</Button>
          </div>
        </MotionCard>
      ))}
    </div>
  );
}
