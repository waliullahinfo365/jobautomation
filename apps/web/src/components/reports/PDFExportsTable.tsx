import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { ReportTypeBadge } from "./ReportTypeBadge";
import { formatDate } from "@/lib/utils";
import type { PDFExportRecord } from "@/types/report";

export function PDFExportsTable({
  records,
  onExportAgain,
}: {
  records: PDFExportRecord[];
  onExportAgain?: (record: PDFExportRecord) => void;
}) {
  return (
    <SectionCard title="PDF Export Tracking" description="Document export queue and statuses." contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Name</TableHead>
            <TableHead>Related Job</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Export Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>PDF Link</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.documentName}</TableCell>
              <TableCell>{record.relatedJob}</TableCell>
              <TableCell><ReportTypeBadge type={record.type} /></TableCell>
              <TableCell><ReportStatusBadge status={record.exportStatus} /></TableCell>
              <TableCell>{formatDate(record.createdAt, "MMM d, yyyy HH:mm")}</TableCell>
              <TableCell><a href={record.pdfLink} className="text-[var(--text-2)] hover:underline">View PDF</a></TableCell>
              <TableCell className="text-right">
                <div className="inline-flex gap-2">
                  <Button size="sm" variant="outline">View</Button>
                  <Button size="sm" variant="secondary" type="button" onClick={() => onExportAgain?.(record)}>
                    Export Again
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
