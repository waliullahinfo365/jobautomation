import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { CoverLetterRecord } from "@/types/document";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { ReportStatusBadge } from "@/components/reports/ReportStatusBadge";
import { formatDate } from "@/lib/utils";

export function CoverLettersSection({ records }: { records: CoverLetterRecord[] }) {
  return (
    <SectionCard title="Cover Letters" description="Role-specific and AI-assisted cover letter records." contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Related Job</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>AI Generated</TableHead>
            <TableHead>PDF Export</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.fileName}</TableCell>
              <TableCell>{r.company}</TableCell>
              <TableCell>{r.position}</TableCell>
              <TableCell>{r.relatedJob}</TableCell>
              <TableCell><DocumentStatusBadge status={r.status} /></TableCell>
              <TableCell>{r.aiGenerated ? "Yes" : "No"}</TableCell>
              <TableCell><ReportStatusBadge status={r.pdfExportStatus} /></TableCell>
              <TableCell>{formatDate(r.lastUpdated, "MMM d, yyyy HH:mm")}</TableCell>
              <TableCell className="text-right">
                <div className="inline-flex gap-2">
                  <Button size="sm" variant="outline">View</Button>
                  <Button size="sm" variant="secondary">Regenerate</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
