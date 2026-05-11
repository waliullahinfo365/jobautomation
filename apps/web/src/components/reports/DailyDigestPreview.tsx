import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyDigestData } from "@/types/report";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { useTranslation } from "@/i18n/I18nProvider";

export function DailyDigestPreview({
  digest,
  onPreviewDigest,
  onSendTest,
  previewLoading,
  sendLoading,
}: {
  digest: DailyDigestData;
  onPreviewDigest?: () => void;
  onSendTest?: () => void;
  previewLoading?: boolean;
  sendLoading?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("reports.dailyDigestPreview")}</CardTitle>
            <CardDescription>{digest.date}</CardDescription>
          </div>
          <ReportStatusBadge status={digest.deliveryStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label={t("reports.newJobs")} value={digest.newJobsDetected} />
          <Metric label={t("reports.applicationsSent")} value={digest.applicationsSent} />
          <Metric label={t("reports.followUpsDue")} value={digest.followUpsDue} />
          <Metric label={t("reports.repliesReceived")} value={digest.repliesReceived} />
          <Metric label={t("reports.deadlinesApproaching")} value={digest.deadlinesApproaching} />
          <Metric label={t("reports.interviewsScheduled")} value={digest.interviewsScheduled} />
          <Metric label={t("reports.failedAutomations")} value={digest.failedAutomations} />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-1)]">{t("reports.recommendedActions")}</p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--text-2)]">
            {digest.recommendedActions.map((action) => (
              <li key={action}>- {action}</li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-sm">
          <Meta label={t("reports.recipientEmail")} value={digest.recipientEmail} />
          <Meta label={t("reports.lastSentTime")} value={digest.lastSentTime} />
          <Meta label={t("reports.nextScheduledTime")} value={digest.nextScheduledTime} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" disabled={previewLoading} onClick={() => onPreviewDigest?.()}>
            {previewLoading ? t("reports.generating") : t("reports.previewDigest")}
          </Button>
          <Button variant="secondary" type="button" disabled={sendLoading} onClick={() => onSendTest?.()}>
            {sendLoading ? t("reports.generating") : t("reports.sendTestDigest")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-3">
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="text-lg font-semibold text-[var(--text-1)]">{value}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="text-[var(--text-2)]">{value}</p>
    </div>
  );
}
