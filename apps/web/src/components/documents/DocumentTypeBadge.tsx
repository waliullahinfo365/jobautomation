import type { DocumentType } from "@/types/document";
import { Badge } from "@/components/ui/badge";

export function DocumentTypeBadge({ type }: { type: DocumentType }) {
  return <Badge variant="default">{type}</Badge>;
}
