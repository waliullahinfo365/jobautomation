import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FolderActivityRecord } from "@/types/document";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export function FolderActivityTable({ records }: { records: FolderActivityRecord[] }) {
  return (
    <SectionCard title="Recent Folder Activity" contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Job</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Folder Path</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{formatDate(r.time, "MMM d, HH:mm")}</TableCell>
              <TableCell>{r.job}</TableCell>
              <TableCell>{r.action}</TableCell>
              <TableCell className="max-w-xs truncate text-[var(--text-2)]">{r.folderPath}</TableCell>
              <TableCell>
                <Badge variant={r.status === "Success" ? "success" : r.status === "Warning" ? "warning" : "danger"}>{r.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
