import { Checkbox } from "@/components/ui/checkbox";
import type { InterviewPrepChecklistItem } from "@/types/interview";

export function InterviewPrepChecklist({ items }: { items: InterviewPrepChecklistItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <label key={item.id} className="flex items-center gap-2 rounded-md border border-border bg-card/40 p-2 text-sm">
          <Checkbox checked={item.done} onCheckedChange={() => undefined} />
          <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>{item.label}</span>
        </label>
      ))}
    </div>
  );
}
