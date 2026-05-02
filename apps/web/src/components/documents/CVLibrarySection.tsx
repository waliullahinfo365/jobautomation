import { SectionCard } from "@/components/shared/SectionCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CVVersion } from "@/types/document";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { formatDate } from "@/lib/utils";

export function CVLibrarySection({
  records,
  onSetDefault,
}: {
  records: CVVersion[];
  onSetDefault: (id: string) => void;
}) {
  return (
    <SectionCard title="CV Library" description="Role-specific CV versions and default routing preference.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {records.map((cv) => (
          <Card key={cv.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[var(--text-1)]">{cv.cvName}</p>
                  <p className="text-xs text-[var(--text-3)]">{cv.targetRole} · {cv.industry}</p>
                </div>
                {cv.isDefault ? <Badge variant="success">Default</Badge> : null}
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-3)]">
                <Badge variant="default">{cv.version}</Badge>
                <DocumentStatusBadge status={cv.status} />
              </div>
              <p className="text-xs text-[var(--text-3)]">Used in {cv.usedInApplicationsCount} applications</p>
              <p className="text-xs text-[var(--text-3)]">Updated {formatDate(cv.lastUpdated)}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">View</Button>
                <Button size="sm" variant="secondary" onClick={() => onSetDefault(cv.id)}>Set Default</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionCard>
  );
}
