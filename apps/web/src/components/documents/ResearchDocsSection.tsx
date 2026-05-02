import { SectionCard } from "@/components/shared/SectionCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ResearchDocumentRecord } from "@/types/document";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { formatDate } from "@/lib/utils";

export function ResearchDocsSection({ records }: { records: ResearchDocumentRecord[] }) {
  return (
    <SectionCard title="Research Documents" description="AI-generated and manually refined research notes.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {records.map((r) => (
          <Card key={r.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-[var(--text-1)]">{r.documentName}</p>
                  <p className="text-xs text-[var(--text-3)]">{r.company} · {r.position}</p>
                </div>
                <DocumentStatusBadge status={r.researchStatus} />
              </div>
              <p className="text-sm text-[var(--text-2)]">{r.aiSummarySnippet}</p>
              <p className="text-xs text-[var(--text-3)]">Created {formatDate(r.createdAt, "MMM d, yyyy HH:mm")}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">View Research</Button>
                <Button size="sm" variant="secondary">Update</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionCard>
  );
}
