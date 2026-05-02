import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyDigestData } from "@/types/report";
import { ReportStatusBadge } from "./ReportStatusBadge";

export function DailyDigestPreview({
  digest,
  onPreviewEmail,
  onSendTest,
}: {
  digest: DailyDigestData;
  onPreviewEmail?: () => void;
  onSendTest?: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily Digest Preview</CardTitle>
            <CardDescription>{digest.date}</CardDescription>
          </div>
          <ReportStatusBadge status={digest.deliveryStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="New jobs" value={digest.newJobsDetected} />
          <Metric label="Applications sent" value={digest.applicationsSent} />
          <Metric label="Follow-ups due" value={digest.followUpsDue} />
          <Metric label="Replies received" value={digest.repliesReceived} />
          <Metric label="Deadlines approaching" value={digest.deadlinesApproaching} />
          <Metric label="Failed automations" value={digest.failedAutomations} />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-1)]">Recommended actions</p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--text-2)]">
            {digest.recommendedActions.map((action) => (
              <li key={action}>- {action}</li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-sm">
          <Meta label="Recipient Email" value={digest.recipientEmail} />
          <Meta label="Last Sent Time" value={digest.lastSentTime} />
          <Meta label="Next Scheduled" value={digest.nextScheduledTime} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={() => onPreviewEmail?.()}>
            Preview Email
          </Button>
          <Button variant="secondary" type="button" onClick={() => onSendTest?.()}>
            Send Test
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
