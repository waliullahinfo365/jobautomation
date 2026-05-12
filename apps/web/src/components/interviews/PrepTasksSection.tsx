"use client";

import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrepStatusBadge } from "./PrepStatusBadge";
import { useTranslation } from "@/i18n/useTranslation";
import type { PrepTask } from "@/types/interview";

const TASK_TYPE_KEY: Record<string, string> = {
  "Research Company": "interviews.taskType.researchCompany",
  "Review Job Description": "interviews.taskType.reviewJobDescription",
  "Practice Answers": "interviews.taskType.practiceAnswers",
};

const PRIORITY_KEY: Record<string, string> = {
  Low: "interviews.priority.low",
  Medium: "interviews.priority.medium",
  High: "interviews.priority.high",
};

export function PrepTasksSection({
  tasks,
  onMarkDone,
}: {
  tasks: PrepTask[];
  onMarkDone: (taskId: string) => void;
}) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <SectionCard title={t("interviews.prep.title")} description={t("interviews.prep.subtitle")} contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("interviews.prep.company")}</TableHead>
            <TableHead>{t("interviews.prep.position")}</TableHead>
            <TableHead>{t("interviews.prep.task")}</TableHead>
            <TableHead>{t("interviews.prep.taskType")}</TableHead>
            <TableHead>{t("interviews.prep.dueDate")}</TableHead>
            <TableHead>{t("interviews.prep.priority")}</TableHead>
            <TableHead>{t("interviews.prep.status")}</TableHead>
            <TableHead className="text-right">{t("interviews.prep.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.company}</TableCell>
              <TableCell>{task.position}</TableCell>
              <TableCell>{task.title}</TableCell>
              <TableCell>{t(TASK_TYPE_KEY[task.taskType] ?? task.taskType)}</TableCell>
              <TableCell>{dateFmt.format(new Date(task.dueDate))}</TableCell>
              <TableCell>{t(PRIORITY_KEY[task.priority] ?? task.priority)}</TableCell>
              <TableCell><PrepStatusBadge status={task.status} /></TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" onClick={() => onMarkDone(task.id)}>{t("interviews.prep.markDone")}</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
