"use client";

import type { Application } from "@/types/application";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SectionCard } from "@/components/shared/SectionCard";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { ResponseStatusBadge } from "./ResponseStatusBadge";
import { FollowUpStatusBadge } from "./FollowUpStatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface ApplicationsTableProps {
  applications: Application[];
  onView: (app: Application) => void;
  onMarkFollowUpSent: (id: string) => void;
}

export function ApplicationsTable({ applications, onView, onMarkFollowUpSent }: ApplicationsTableProps) {
  return (
    <SectionCard
      title="Applications"
      description="Submitted and active applications with reply/follow-up tracking."
      contentClassName="p-0"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Application Status</TableHead>
            <TableHead>Response Status</TableHead>
            <TableHead>Follow-up Status</TableHead>
            <TableHead>Date Applied</TableHead>
            <TableHead>Follow-up Date</TableHead>
            <TableHead>Contact Email</TableHead>
            <TableHead>Automation</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
              <TableCell>{app.dateApplied ? formatDate(app.dateApplied) : "—"}</TableCell>
              <TableCell>{app.followUpDate ? formatDate(app.followUpDate) : "—"}</TableCell>
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
                  {app.automationHealth}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex flex-wrap items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onView(app)}>
                    View
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => onMarkFollowUpSent(app.id)}>
                    Mark Follow-Up Sent
                  </Button>
                  <Button variant="ghost" size="sm">
                    Open Email
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
