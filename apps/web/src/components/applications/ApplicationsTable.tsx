"use client";

import type { Application } from "@/types/application";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionCard } from "@/components/shared/SectionCard";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { ResponseStatusBadge } from "./ResponseStatusBadge";
import { FollowUpStatusBadge } from "./FollowUpStatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n/useTranslation";

interface ApplicationsTableProps {
  applications: Application[];
  onView: (app: Application) => void;
  onMarkFollowUpSent: (id: string) => void;
}

const AUTOMATION_KEY: Record<string, string> = {
  Healthy: "applications.automationStatus.healthy",
  Warning: "applications.automationStatus.warning",
  Failed: "applications.automationStatus.failed",
  Running: "applications.automationStatus.running",
};

export function ApplicationsTable({ applications, onView, onMarkFollowUpSent }: ApplicationsTableProps) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";

  function fmtDate(d: string | Date) {
    const dt = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(dt.getTime())) return "—";
    return new Intl.DateTimeFormat(bcp47, { day: "numeric", month: "long", year: "numeric" }).format(dt);
  }

  return (
    <SectionCard
      title={t("applications.table.title")}
      description={t("applications.table.subtitle")}
      contentClassName="p-0"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("applications.table.company")}</TableHead>
            <TableHead>{t("applications.table.position")}</TableHead>
            <TableHead>{t("applications.table.applicationStatus")}</TableHead>
            <TableHead>{t("applications.table.responseStatus")}</TableHead>
            <TableHead>{t("applications.table.followupStatus")}</TableHead>
            <TableHead>{t("applications.table.dateApplied")}</TableHead>
            <TableHead>{t("applications.table.followupDate")}</TableHead>
            <TableHead>{t("applications.table.contactEmail")}</TableHead>
            <TableHead>{t("applications.table.automation")}</TableHead>
            <TableHead className="text-right">{t("applications.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell className="font-medium">{app.company}</TableCell>
              <TableCell>{app.position}</TableCell>
              <TableCell><ApplicationStatusBadge status={app.applicationStatus} /></TableCell>
              <TableCell><ResponseStatusBadge status={app.responseStatus} /></TableCell>
              <TableCell><FollowUpStatusBadge status={app.followUpStatus} /></TableCell>
              <TableCell>{app.dateApplied ? fmtDate(app.dateApplied) : "—"}</TableCell>
              <TableCell>{app.followUpDate ? fmtDate(app.followUpDate) : "—"}</TableCell>
              <TableCell className="text-[var(--text-2)]">{app.contactEmail}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    app.automationHealth === "Healthy"
                      ? "success"
                      : app.automationHealth === "Warning"
                      ? "warning"
                      : "danger"
                  }
                >
                  {AUTOMATION_KEY[app.automationHealth]
                    ? t(AUTOMATION_KEY[app.automationHealth])
                    : app.automationHealth}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex flex-wrap items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onView(app)}>
                    {t("applications.table.view")}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => onMarkFollowUpSent(app.id)}>
                    {t("applications.table.markFollowupSent")}
                  </Button>
                  {app.contactEmail ? (
                    <a
                      href={
                        app.providerThreadId
                          ? `https://mail.google.com/mail/u/0/#inbox/${app.providerThreadId}`
                          : `mailto:${app.contactEmail}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-accent"
                    >
                      {t("applications.table.openEmail")}
                    </a>
                  ) : null}
                  {app.jobUrl ? (
                    <a
                      href={app.jobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-accent"
                    >
                      {t("applications.table.openJob")}
                    </a>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
