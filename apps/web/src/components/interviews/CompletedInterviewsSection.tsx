import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { useTranslation } from "@/i18n/useTranslation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { CompletedInterview } from "@/types/interview";

export function CompletedInterviewsSection({ interviews }: { interviews: CompletedInterview[] }) {
  const { t } = useTranslation();
  return (
    <SectionCard title={t("interviews.completedInterviews")} description={t("interviews.trackOutcomesAndFollowUpStatus")} contentClassName="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("interviews.company")}</TableHead>
            <TableHead>{t("interviews.position")}</TableHead>
            <TableHead>{t("interviews.interviewType")}</TableHead>
            <TableHead>{t("interviews.completedDate")}</TableHead>
            <TableHead>{t("interviews.outcome")}</TableHead>
            <TableHead>{t("interviews.notesSummary")}</TableHead>
            <TableHead>{t("interviews.followUpSent")}</TableHead>
            <TableHead className="text-right">{t("interviews.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {interviews.map((iv) => (
            <TableRow key={iv.id}>
              <TableCell className="font-medium">{iv.company}</TableCell>
              <TableCell>{iv.position}</TableCell>
              <TableCell>{iv.interviewType}</TableCell>
              <TableCell>{formatDate(iv.completedDate, "MMM d, yyyy")}</TableCell>
              <TableCell>{iv.outcome}</TableCell>
              <TableCell className="max-w-[280px] truncate">{iv.notesSummary}</TableCell>
              <TableCell>{iv.followUpSent ? t("interviews.yes") : t("interviews.no")}</TableCell>
              <TableCell className="text-right"><Button size="sm" variant="ghost">{t("interviews.viewNotes")}</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
