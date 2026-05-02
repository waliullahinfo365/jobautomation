import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { DocumentTypeBadge } from "./DocumentTypeBadge";
import { formatDate } from "@/lib/utils";
import type { DocumentRecord } from "@/types/document";

export function AllDocumentsTable({
  records,
  onExportPdf,
  onRouteCv,
  onOpenFolder,
}: {
  records: DocumentRecord[];
  onExportPdf?: (record: DocumentRecord) => void | Promise<void>;
  onRouteCv?: (record: DocumentRecord) => void | Promise<void>;
  onOpenFolder?: (record: DocumentRecord) => void | Promise<void>;
}) {
  return (
    <SectionCard title="All Documents" description="All document assets across jobs and automations." contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Related Job</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Storage Location</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.fileName}</TableCell>
              <TableCell>
                <DocumentTypeBadge type={record.type} />
              </TableCell>
              <TableCell>{record.relatedJob}</TableCell>
              <TableCell>{record.company}</TableCell>
              <TableCell>
                <DocumentStatusBadge status={record.status} />
              </TableCell>
              <TableCell className="max-w-xs truncate text-[var(--text-2)]">{record.storageLocation}</TableCell>
              <TableCell>{formatDate(record.lastUpdated, "MMM d, yyyy HH:mm")}</TableCell>
              <TableCell className="text-right">
                <div className="inline-flex flex-wrap justify-end gap-2">
                  <Button size="sm" variant="outline" type="button">
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => void onExportPdf?.(record)}
                  >
                    Export PDF
                  </Button>
                  {record.type === "CV" ? (
                    <Button size="sm" variant="outline" type="button" onClick={() => void onRouteCv?.(record)}>
                      Route CV
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" type="button" onClick={() => void onOpenFolder?.(record)}>
                    Open Folder
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
