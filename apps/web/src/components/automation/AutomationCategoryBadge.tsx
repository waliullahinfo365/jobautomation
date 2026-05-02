import { Badge } from "@/components/ui/badge";
import type { AutomationCategory } from "@/types/automation";

export function AutomationCategoryBadge({ category }: { category: AutomationCategory }) {
  return <Badge variant="default">{category}</Badge>;
}
