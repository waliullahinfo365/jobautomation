import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { ReportTypeBadge } from "./ReportTypeBadge";
import { ReportHistoryCard } from "./ReportHistoryCard";
import type { ReportHistoryRecord } from "@/types/report";
import { useTranslation } from "@/i18n/I18nProvider";

const DELIVERY_LABEL_KEY: Record<string, string> = {
  "Delivery warning": "reports.deliveryLabel.deliveryWarning",
  "Not delivered": "reports.deliveryLabel.notDelivered",
  "Delivered": "reports.deliveryLabel.delivered",
  "Preview only": "reports.deliveryLabel.previewOnly",
  "Sent": "reports.deliveryLabel.sent",
  "Failed": "reports.deliveryLabel.failed",
  "Queued": "reports.deliveryLabel.queued",
  "Not sent": "reports.deliveryLabel.notSent",
};

function deliveryLabelRaw(record: ReportHistoryRecord): string {
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

const METHOD_KEY: Record<string, string> = {
  dashboard: "reports.deliveryMethod.dashboard",
  "dashboard+drive": "reports.deliveryMethod.dashboardDrive",
  "telegram+slack": "reports.deliveryMethod.telegramSlack",
  slack: "reports.deliveryMethod.slack",
  telegram: "reports.deliveryMethod.telegram",
  email: "reports.deliveryMethod.email",
};

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
  const { t, locale } = useTranslation();
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));

  return (
    <SectionCard title={t("reports.reportHistory")} description={t("reports.allGeneratedAndScheduledReports")} contentClassName="p-0">
      <div className="grid gap-3 p-4 md:hidden">
        {records.map((record) => (
          <ReportHistoryCard
            key={record.id}
            record={record}
            onView={onView}
            onSendTest={onSendTest}
            busyId={busyId}
          />
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
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
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const rawLabel = deliveryLabelRaw(record);
            const methodKey = METHOD_KEY[record.deliveryMethod?.toLowerCase() ?? ""];
            return (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.reportName}</TableCell>
                <TableCell><ReportTypeBadge type={record.type} /></TableCell>
                <TableCell><ReportStatusBadge status={record.status} deliveryWarning={record.deliveryWarning} /></TableCell>
                <TableCell>{fmt(record.generatedAt)}</TableCell>
                <TableCell>{record.sentTo}</TableCell>
                <TableCell title={record.deliveryWarningSummary}>
                  {DELIVERY_LABEL_KEY[rawLabel] ? t(DELIVERY_LABEL_KEY[rawLabel]) : rawLabel}
                </TableCell>
                <TableCell>{methodKey ? t(methodKey) : record.deliveryMethod}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="ghost" type="button" onClick={() => onView?.(record)}>
                      {t("reports.history.view")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => onSendTest?.(record)}
                      disabled={busyId === record.id}
                    >
                      {busyId === record.id ? t("reports.history.sending") : t("reports.history.sendTest")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </SectionCard>
  );
}
