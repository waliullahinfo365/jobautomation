import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { ReportTypeBadge } from "./ReportTypeBadge";
import { formatDate } from "@/lib/utils";
import type { PDFExportRecord } from "@/types/report";

export function PDFExportsTable({
  records,
  onPreviewText,
  onExportAgain,
  busyId,
}: {
  records: PDFExportRecord[];
  /** Opens modal / preview when there is no public PDF URL */
  onPreviewText?: (record: PDFExportRecord) => void;
  onExportAgain?: (record: PDFExportRecord) => void;
  busyId?: string | null;
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
            <TableHead>Export</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.documentName}</TableCell>
              <TableCell>{record.relatedJob}</TableCell>
              <TableCell>
                <ReportTypeBadge type={record.type} />
              </TableCell>
              <TableCell>
                <ReportStatusBadge status={record.exportStatus} />
              </TableCell>
              <TableCell>{formatDate(record.createdAt, "MMM d, yyyy HH:mm")}</TableCell>
              <TableCell>
                {record.exportPublicUrl ? (
                  <button
                    type="button"
                    className="text-[var(--text-2)] underline hover:no-underline"
                    onClick={() => window.open(record.exportPublicUrl, "_blank", "noopener,noreferrer")}
                  >
                    Open PDF
                  </button>
                ) : record.textPreviewAvailable && onPreviewText ? (
                  <button
                    type="button"
                    className="text-[var(--text-2)] underline hover:no-underline"
                    onClick={() => onPreviewText(record)}
                  >
                    Preview Text
                  </button>
                ) : record.textPreviewAvailable ? (
                  <span className="text-muted-foreground text-sm">Text export — open row actions</span>
                ) : (
                  <span className="text-muted-foreground">Pending</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="secondary"
                  type="button"
                  disabled={busyId === record.id || !record.documentId}
                  title={record.documentId ? undefined : "Only document exports can be re-queued from here"}
                  onClick={() => onExportAgain?.(record)}
                >
                  {busyId === record.id ? "Queueing..." : "Export Again"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
