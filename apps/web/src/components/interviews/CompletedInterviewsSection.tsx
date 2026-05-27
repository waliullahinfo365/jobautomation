"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { Modal } from "@/components/ui/modal";
import { useTranslation } from "@/i18n/useTranslation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CompletedInterview, InterviewType } from "@/types/interview";

const TYPE_KEY: Record<InterviewType, string> = {
  "Recruiter Screen": "interviews.interviewType.recruiterScreen",
  Technical: "interviews.interviewType.technical",
  Behavioral: "interviews.interviewType.behavioral",
  "Hiring Manager": "interviews.interviewType.hiringManager",
  Panel: "interviews.interviewType.panel",
  "Final Round": "interviews.interviewType.finalRound",
  "Offer Discussion": "interviews.interviewType.offerDiscussion",
};

const OUTCOME_KEY: Record<string, string> = {
  "Waiting Feedback": "interviews.outcome.waitingFeedback",
  Positive: "interviews.outcome.positive",
  Negative: "interviews.outcome.negative",
  Offer: "interviews.outcome.offer",
  Rejected: "interviews.outcome.rejected",
};

export function CompletedInterviewsSection({ interviews }: { interviews: CompletedInterview[] }) {
  const { t, locale } = useTranslation();
  const bcp47 = locale === "de" ? "de-DE" : "en-US";
  const dateFmt = new Intl.DateTimeFormat(bcp47, { month: "short", day: "numeric", year: "numeric" });
  const [notesInterview, setNotesInterview] = useState<CompletedInterview | null>(null);

  return (
    <>
      <SectionCard title={t("interviews.completed.title")} description={t("interviews.completed.subtitle")} contentClassName="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("interviews.completed.company")}</TableHead>
              <TableHead>{t("interviews.completed.position")}</TableHead>
              <TableHead>{t("interviews.completed.interviewType")}</TableHead>
              <TableHead>{t("interviews.completed.completedDate")}</TableHead>
              <TableHead>{t("interviews.completed.outcome")}</TableHead>
              <TableHead>{t("interviews.completed.notesSummary")}</TableHead>
              <TableHead>{t("interviews.completed.followupSent")}</TableHead>
              <TableHead className="text-right">{t("interviews.completed.action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interviews.map((iv) => (
              <TableRow key={iv.id}>
                <TableCell className="font-medium">{iv.company}</TableCell>
                <TableCell>{iv.position}</TableCell>
                <TableCell>{t(TYPE_KEY[iv.interviewType as InterviewType] ?? iv.interviewType)}</TableCell>
                <TableCell>{dateFmt.format(new Date(iv.completedDate))}</TableCell>
                <TableCell>{t(OUTCOME_KEY[iv.outcome as string] ?? iv.outcome)}</TableCell>
                <TableCell className="max-w-[280px] truncate">{iv.notesSummary}</TableCell>
                <TableCell>{iv.followUpSent ? t("interviews.completed.yes") : t("interviews.completed.no")}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setNotesInterview(iv)}>
                    {t("interviews.completed.showNotes")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <Modal
        isOpen={!!notesInterview}
        onClose={() => setNotesInterview(null)}
        title={notesInterview ? `${notesInterview.company} — ${notesInterview.position}` : ""}
        size="md"
      >
        {notesInterview && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              {dateFmt.format(new Date(notesInterview.completedDate))} · {t(TYPE_KEY[notesInterview.interviewType as InterviewType] ?? notesInterview.interviewType)} · {t(OUTCOME_KEY[notesInterview.outcome as string] ?? notesInterview.outcome)}
            </div>
            <pre className="whitespace-pre-wrap rounded-md bg-muted/70 p-4 text-sm text-foreground leading-relaxed">
              {notesInterview.notesSummary || t("interviews.completed.noNotes")}
            </pre>
          </div>
        )}
      </Modal>
    </>
  );
}
