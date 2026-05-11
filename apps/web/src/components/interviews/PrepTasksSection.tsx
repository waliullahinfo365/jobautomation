import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrepStatusBadge } from "./PrepStatusBadge";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import type { PrepTask } from "@/types/interview";

export function PrepTasksSection({
  tasks,
  onMarkDone,
}: {
  tasks: PrepTask[];
  onMarkDone: (taskId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <SectionCard title={t("interviews.prepTasks")} description={t("interviews.prioritizedPrepChecklist")} contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Task Type</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.company}</TableCell>
              <TableCell>{task.position}</TableCell>
              <TableCell>{task.title}</TableCell>
              <TableCell>{task.taskType}</TableCell>
              <TableCell>{formatDate(task.dueDate, "MMM d, yyyy HH:mm")}</TableCell>
              <TableCell>{task.priority}</TableCell>
              <TableCell><PrepStatusBadge status={task.status} /></TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" onClick={() => onMarkDone(task.id)}>Mark Done</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
