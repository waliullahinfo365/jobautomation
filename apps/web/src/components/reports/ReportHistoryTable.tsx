import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { ReportTypeBadge } from "./ReportTypeBadge";
import { formatDate } from "@/lib/utils";
import type { ReportHistoryRecord } from "@/types/report";
import { useTranslation } from "@/i18n/I18nProvider";

function deliveryLabel(record: ReportHistoryRecord): string {
  if (record.deliveryOutcome === "Delivery warning") return "Delivery warning";
  if (record.deliveryOutcome === "Not delivered") return "Not delivered";
  if (record.deliveryOutcome === "Delivered") return "Delivered";
  if (record.deliveryWarning) return "Delivery warning";
  if (record.previewOnly) return "Preview only";
  if (record.deliveryStatus === "Sent") return "Sent";
  if (record.deliveryStatus === "Failed") return "Failed";
  if (record.deliveryStatus === "Queued") return "Queued";
  return "Not sent";
}

export function ReportHistoryTable({
  records,
  onView,
  onSendTest,
  busyId,
}: {
  records: ReportHistoryRecord[];
  onView?: (record: ReportHistoryRecord) => void;
  onSendTest?: (record: ReportHistoryRecord) => void;
  busyId?: string | null;
}) {
  const { t } = useTranslation();
  return (
    <SectionCard title={t("reports.reportHistory")} description={t("reports.allGeneratedAndScheduledReports")} contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("reports.reportName")}</TableHead>
            <TableHead>{t("reports.type")}</TableHead>
            <TableHead>{t("reports.status")}</TableHead>
            <TableHead>{t("reports.generatedAt")}</TableHead>
            <TableHead>{t("reports.sentTo")}</TableHead>
            <TableHead>{t("reports.outcome")}</TableHead>
            <TableHead>{t("reports.method")}</TableHead>
            <TableHead className="text-right">{t("reports.export")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.reportName}</TableCell>
              <TableCell><ReportTypeBadge type={record.type} /></TableCell>
              <TableCell><ReportStatusBadge status={record.status} deliveryWarning={record.deliveryWarning} /></TableCell>
              <TableCell>{formatDate(record.generatedAt, "MMM d, yyyy HH:mm")}</TableCell>
              <TableCell>{record.sentTo}</TableCell>
              <TableCell title={record.deliveryWarningSummary}>{deliveryLabel(record)}</TableCell>
              <TableCell>{record.deliveryMethod}</TableCell>
              <TableCell className="text-right">
                <div className="inline-flex gap-2">
                  <Button size="sm" variant="ghost" type="button" onClick={() => onView?.(record)}>
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => onSendTest?.(record)}
                    disabled={busyId === record.id}
                  >
                    {busyId === record.id ? "Sending..." : "Send Test"}
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
