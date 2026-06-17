"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { ArrowRightIcon, DocumentsIcon, JobsIcon } from "@/components/icons";
import { useTranslation } from "@/i18n/useTranslation";
import { getJob } from "@/lib/api/jobs.api";
import {
  completeApplyAssistant,
  generateApplyAnswer,
  getApplyDocumentStatus,
  shareApplyDocument,
  type ApplyCompleteStatus,
  type ApplyDocumentStatus,
} from "@/lib/api/apply-assistant.api";
import { normalizeJobForUi } from "@/lib/utils/resource";
import { showError, showSuccess } from "@/lib/ui/toast";
import type { Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

function MissingDocumentCard({
  title,
  description,
  buttonLabel,
  href,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-bg)] text-[var(--accent-hi)]">
        <DocumentsIcon size={20} />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[var(--text-1)]">{title}</p>
        <p className="mt-0.5 text-[12.5px] text-[var(--text-3)]">{description}</p>
      </div>
      <Link
        href={href}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-colors",
          "bg-[var(--accent-bg)] text-[var(--accent-hi)] hover:bg-[var(--accent-ring)]"
        )}
      >
        {buttonLabel}
        <ArrowRightIcon size={13} />
      </Link>
    </div>
  );
}

export function ManualApplyAssistantClient() {
  const { t } = useTranslation();
  const params = useParams();
  const id = String(params?.id ?? "");
  const [job, setJob] = useState<Job | null>(null);
  const [docStatus, setDocStatus] = useState<ApplyDocumentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState<"cv" | "cover_letter" | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [completeStatus, setCompleteStatus] = useState<ApplyCompleteStatus>("Applied");
  const [notes, setNotes] = useState("");
  const [proofDocumentId, setProofDocumentId] = useState("");
  const [completeLoading, setCompleteLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    void Promise.all([getJob(id), getApplyDocumentStatus(id)])
      .then(([raw, status]) => {
        setJob(normalizeJobForUi(raw));
        setDocStatus(status);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load job"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDocument = useCallback(
    async (role: "cv" | "cover_letter") => {
      if (role === "cv" && docStatus?.missingDocuments.cv) return;
      if (role === "cover_letter" && docStatus?.missingDocuments.coverLetter) return;
      setDocLoading(role);
      try {
        await shareApplyDocument(id, role);
        showSuccess(t("applyAssistant.downloadSuccess"));
      } catch (e) {
        showError(e instanceof ApiError ? e.message : "Download failed");
      } finally {
        setDocLoading(null);
      }
    },
    [id, t, docStatus]
  );

  const handleGenerateAnswer = useCallback(async () => {
    if (!questionText.trim()) return;
    setAnswerLoading(true);
    try {
      const result = await generateApplyAnswer(id, questionText.trim());
      setAnswer(result.answer);
    } catch (e) {
      showError(e instanceof ApiError ? e.message : "Generate answer failed");
    } finally {
      setAnswerLoading(false);
    }
  }, [id, questionText]);

  const handleCopyAnswer = useCallback(async () => {
    if (!answer) return;
    try {
      await navigator.clipboard.writeText(answer);
      showSuccess(t("applyAssistant.copySuccess"));
    } catch {
      showError("Copy failed");
    }
  }, [answer, t]);

  const handleComplete = useCallback(async () => {
    setCompleteLoading(true);
    try {
      const documentIds = [
        docStatus?.cv.documentId,
        docStatus?.coverLetter.documentId,
      ].filter((value): value is string => Boolean(value?.trim()));
      await completeApplyAssistant(id, {
        status: completeStatus,
        notes: notes.trim() || undefined,
        proofDocumentId: proofDocumentId.trim() || undefined,
        documentIds: documentIds.length ? documentIds : undefined,
      });
      showSuccess(t("applyAssistant.completeSuccess"));
      setSheetOpen(false);
    } catch (e) {
      showError(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setCompleteLoading(false);
    }
  }, [id, completeStatus, notes, proofDocumentId, docStatus, t]);

  if (loading) {
    return <LoadingState title={t("applyAssistant.loading")} description="" />;
  }

  if (error || !job) {
    return (
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-6 text-sm text-[var(--text-3)]">
        {error ?? t("applyAssistant.notFound")}
        <div className="mt-4">
          <Link href={`/jobs/${id}`} className="text-[var(--accent-hi)] hover:underline">
            {t("applyAssistant.backToJobs")}
          </Link>
        </div>
      </div>
    );
  }

  const jobUrl = job.jobUrl ?? "";
  const missingCv = docStatus?.missingDocuments.cv ?? false;
  const missingCoverLetter = docStatus?.missingDocuments.coverLetter ?? false;
  const usesContentTextExport =
    docStatus?.cv.delivery === "content_text" || docStatus?.coverLetter.delivery === "content_text";

  return (
    <div className="pb-36">
      <PageHeader
        icon={JobsIcon}
        eyebrow={t("applyAssistant.eyebrow")}
        title={t("applyAssistant.title")}
        description={`${job.position} · ${job.company}`}
      />

      <div className="mt-6 space-y-4">
        {jobUrl ? (
          <a
            href={jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-xl bg-[var(--accent-hi)] px-4 py-3 text-sm font-semibold text-white"
          >
            {t("applyAssistant.openJobLink")}
          </a>
        ) : null}
        <p className="text-xs text-[var(--text-3)]">{t("applyAssistant.driveHint")}</p>
        {usesContentTextExport ? (
          <p className="text-xs text-[var(--amber)]">{t("applyAssistant.contentTextHint")}</p>
        ) : null}

        {missingCv ? (
          <MissingDocumentCard
            title={t("applyAssistant.missingCvTitle")}
            description={t("applyAssistant.missingCvDesc")}
            buttonLabel={t("applyAssistant.missingCvCta")}
            href="/documents/upload?type=cv"
          />
        ) : null}

        {missingCoverLetter ? (
          <MissingDocumentCard
            title={t("applyAssistant.missingCoverLetterTitle")}
            description={t("applyAssistant.missingCoverLetterDesc")}
            buttonLabel={t("applyAssistant.missingCoverLetterCta")}
            href="/documents/upload?type=cover_letter_template"
          />
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={docLoading !== null || missingCv}
            onClick={() => void handleDocument("cv")}
          >
            {docLoading === "cv" ? "…" : t("applyAssistant.copyCv")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={docLoading !== null || missingCoverLetter}
            onClick={() => void handleDocument("cover_letter")}
          >
            {docLoading === "cover_letter" ? "…" : t("applyAssistant.copyCoverLetter")}
          </Button>
        </div>

        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 space-y-3">
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder={t("applyAssistant.questionPlaceholder")}
            rows={3}
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)]"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              className="flex-1"
              disabled={answerLoading || !questionText.trim()}
              onClick={() => void handleGenerateAnswer()}
            >
              {answerLoading ? "…" : answer ? t("applyAssistant.regenerateAnswer") : t("applyAssistant.generateAnswer")}
            </Button>
            {answer ? (
              <Button type="button" variant="secondary" onClick={() => void handleCopyAnswer()}>
                {t("applyAssistant.copyAnswer")}
              </Button>
            ) : null}
          </div>
          {answer ? (
            <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-2)]">{answer}</p>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-50 border-t border-[var(--border-default)] bg-[var(--surface-1)] p-3 md:bottom-0 md:left-[var(--sidebar-width,0px)]">
        <div className="mx-auto max-w-lg">
          <Button
            type="button"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setSheetOpen(true)}
          >
            {t("applyAssistant.completeTitle")}
          </Button>
        </div>
      </div>

      {sheetOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-xl">
            <h3 className="text-base font-semibold text-[var(--text-1)]">{t("applyAssistant.completeTitle")}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(
                [
                  ["Applied", t("applyAssistant.statusApplied")],
                  ["In Progress", t("applyAssistant.statusInProgress")],
                  ["Rejected", t("applyAssistant.statusRejected")],
                  ["Interview", t("applyAssistant.statusInterview")],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCompleteStatus(value)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    completeStatus === value
                      ? "border-[var(--accent-hi)] bg-[var(--accent-bg)] text-[var(--accent-hi)]"
                      : "border-[var(--border-subtle)] text-[var(--text-2)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("applyAssistant.notesPlaceholder")}
              rows={3}
              className="mt-3 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm"
            />
            <input
              value={proofDocumentId}
              onChange={(e) => setProofDocumentId(e.target.value)}
              placeholder={t("applyAssistant.proofDocumentId")}
              className="mt-2 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm"
            />
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={completeLoading}
                onClick={() => void handleComplete()}
              >
                {completeLoading ? "…" : t("applyAssistant.completeSubmit")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
