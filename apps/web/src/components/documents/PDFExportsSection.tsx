import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { PDFExportRecord } from "@/types/document";
import { ReportStatusBadge } from "@/components/reports/ReportStatusBadge";
import { DocumentTypeBadge } from "./DocumentTypeBadge";
import { formatDate } from "@/lib/utils";

export function PDFExportsSection({
  records,
  onPreviewText,
}: {
  records: PDFExportRecord[];
  onPreviewText?: (record: PDFExportRecord) => void;
}) {
  return (
    <SectionCard title="PDF Exports" description="PDF generation and export queue status." contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Name</TableHead>
            <TableHead>Source Type</TableHead>
            <TableHead>Related Job</TableHead>
            <TableHead>Export Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Export</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.documentName}</TableCell>
              <TableCell>
                <DocumentTypeBadge type={r.sourceType} />
              </TableCell>
              <TableCell>{r.relatedJob}</TableCell>
              <TableCell>
                <ReportStatusBadge status={r.exportStatus} />
              </TableCell>
              <TableCell>{formatDate(r.createdAt, "MMM d, yyyy HH:mm")}</TableCell>
              <TableCell>
                {r.exportPublicUrl ? (
                  <button
                    type="button"
                    className="text-[var(--text-2)] underline hover:no-underline"
                    onClick={() => window.open(r.exportPublicUrl, "_blank", "noopener,noreferrer")}
                  >
                    Open PDF
                  </button>
                ) : r.textPreviewAvailable && onPreviewText ? (
                  <button
                    type="button"
                    className="text-[var(--text-2)] underline hover:no-underline"
                    onClick={() => onPreviewText?.(r)}
                  >
                    Preview Text
                  </button>
                ) : r.textPreviewAvailable ? (
                  <span className="text-muted-foreground text-sm">Text export — open document</span>
                ) : (
                  <span className="text-muted-foreground">Pending</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="secondary">
                  Export Again
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
