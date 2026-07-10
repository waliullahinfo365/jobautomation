"use client";

import { useRef } from "react";
import type { Job } from "@/types/job";
import type { ScreenshotAnswerItem } from "@/lib/api/apply-assistant.api";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { MissingDocumentCard } from "@/components/jobs/apply-assistant-shared";
import { MapPinIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { resolveExternalJobPostingUrl } from "@/lib/utils/job-posting-url";
import { resolveMobileJobOpenUrl } from "@/lib/utils/mobile-apply";
import { cn } from "@/lib/utils";

export interface ApplyAssistantSimpleViewProps {
  job: Job;
  jobUrl: string | null;
  missingCv: boolean;
  missingCoverLetter: boolean;
  docLoading: "cv" | "cover_letter" | null;
  questionText: string;
  onQuestionChange: (value: string) => void;
  answer: string;
  answerLoading: boolean;
  screenshotPreview: string | null;
  screenshotLoading: boolean;
  screenshotAnswers: ScreenshotAnswerItem[];
  completeLoading: boolean;
  onOpenCv: () => void;
  onOpenCoverLetter: () => void;
  onGenerateAnswer: () => void;
  onCopyAnswer: () => void;
  onScreenshotSelect: (file: File | null) => void;
  onAnalyzeScreenshot: () => void;
  onCopyText: (text: string) => void;
  onMarkApplied: () => void;
  hasScreenshot: boolean;
}

export function ApplyAssistantSimpleView({
  job,
  jobUrl,
  missingCv,
  missingCoverLetter,
  docLoading,
  questionText,
  onQuestionChange,
  answer,
  answerLoading,
  screenshotPreview,
  screenshotLoading,
  screenshotAnswers,
  completeLoading,
  onOpenCv,
  onOpenCoverLetter,
  onGenerateAnswer,
  onCopyAnswer,
  onScreenshotSelect,
  onAnalyzeScreenshot,
  onCopyText,
  onMarkApplied,
  hasScreenshot,
}: ApplyAssistantSimpleViewProps) {
  const { t } = useTranslation();
  const questionRef = useRef<HTMLDivElement>(null);
  const postingUrl = resolveMobileJobOpenUrl(jobUrl ?? resolveExternalJobPostingUrl(job));

  const scrollToQuestion = () => {
    questionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto min-w-0 w-full max-w-lg space-y-5 pb-mobile-sticky md:max-w-xl">
      <header className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] p-5">
        <p className="text-[13px] font-medium text-[var(--text-3)]">{t("applyAssistant.simple.selectedJob")}</p>
        <h1 className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.02em] text-[var(--text-1)]">
          {job.position}
        </h1>
        <p className="mt-1 text-[16px] font-semibold text-[var(--text-2)]">{job.company}</p>
        {job.location ? (
          <p className="mt-2 inline-flex items-center gap-1 text-[14px] text-[var(--text-3)]">
            <MapPinIcon size={14} className="shrink-0" />
            {job.location}
            {job.remote ? ` · ${t("jobs.remote")}` : ""}
          </p>
        ) : null}
        <div className="mt-3">
          <JobStatusBadge status={job.status} />
        </div>
      </header>

      {missingCv ? (
        <MissingDocumentCard
          title={t("applyAssistant.missingCvTitle")}
          description={t("applyAssistant.missingCvDesc")}
          buttonLabel={t("applyAssistant.missingCvCta")}
          href="/documents?upload=cv"
        />
      ) : null}

      {missingCoverLetter ? (
        <MissingDocumentCard
          title={t("applyAssistant.missingCoverLetterTitle")}
          description={t("applyAssistant.missingCoverLetterDesc")}
          buttonLabel={t("applyAssistant.missingCoverLetterCta")}
          href="/documents?upload=cover"
        />
      ) : null}

      <section className="space-y-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--text-4)]">
          {t("applyAssistant.simple.actions")}
        </h2>
        <div className="space-y-2">
          {postingUrl ? (
            <a
              href={postingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 text-[15px] font-semibold text-[var(--text-1)] hover:bg-[var(--surface-2)]"
            >
              {t("applyAssistant.simple.openJobLink")}
            </a>
          ) : null}
          <button
            type="button"
            disabled={docLoading !== null || missingCv}
            onClick={onOpenCv}
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 text-[15px] font-semibold text-[var(--text-1)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            {docLoading === "cv" ? "…" : t("applyAssistant.simple.useCv")}
          </button>
          <button
            type="button"
            disabled={docLoading !== null || missingCoverLetter}
            onClick={onOpenCoverLetter}
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 text-[15px] font-semibold text-[var(--text-1)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            {docLoading === "cover_letter" ? "…" : t("applyAssistant.simple.useCoverLetter")}
          </button>
          <button
            type="button"
            onClick={scrollToQuestion}
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 text-[15px] font-semibold text-[var(--text-1)] transition-colors hover:bg-[var(--surface-2)]"
          >
            {t("applyAssistant.simple.answerQuestion")}
          </button>
        </div>
      </section>

      <section ref={questionRef} className="scroll-mt-4 space-y-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
        <h2 className="text-[15px] font-semibold text-[var(--text-1)]">{t("applyAssistant.simple.questionHelper")}</h2>
        <textarea
          value={questionText}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder={t("applyAssistant.simple.questionPlaceholder")}
          rows={4}
          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-3 text-base text-[var(--text-1)]"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="lg"
            className="min-h-[48px] flex-1 rounded-xl text-[15px] font-semibold"
            disabled={answerLoading || !questionText.trim()}
            onClick={onGenerateAnswer}
          >
            {answerLoading ? "…" : t("applyAssistant.simple.generateAnswer")}
          </Button>
          {answer ? (
            <Button type="button" variant="secondary" size="lg" className="min-h-[48px] rounded-xl" onClick={onCopyAnswer}>
              {t("applyAssistant.copyAnswer")}
            </Button>
          ) : null}
        </div>
        {answer ? (
          <p className="whitespace-pre-wrap rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3 text-[15px] leading-7 text-[var(--text-2)]">
            {answer}
          </p>
        ) : null}

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <p className="mb-2 text-[13px] text-[var(--text-3)]">{t("applyAssistant.simple.screenshotOption")}</p>
          <label className="flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-2)] px-4 text-[14px] font-medium text-[var(--text-2)]">
            {t("applyAssistant.uploadScreenshot")}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onScreenshotSelect(e.target.files?.[0] ?? null)}
            />
          </label>
          {screenshotPreview ? (
            <img
              src={screenshotPreview}
              alt=""
              className="mt-3 max-h-40 w-full rounded-xl border border-[var(--border-subtle)] object-contain bg-[var(--surface-2)]"
            />
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-3 min-h-[48px] w-full rounded-xl"
            disabled={screenshotLoading || !hasScreenshot}
            onClick={onAnalyzeScreenshot}
          >
            {screenshotLoading ? t("applyAssistant.analyzingScreenshot") : t("applyAssistant.analyzeScreenshot")}
          </Button>
          {screenshotAnswers.length > 0 ? (
            <div className="mt-3 space-y-2">
              {screenshotAnswers.map((item, index) => (
                <article
                  key={`${index}-${item.question.slice(0, 24)}`}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3"
                >
                  <p className="text-[13px] font-medium text-[var(--text-1)]">{item.question}</p>
                  <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-[var(--text-2)]">{item.answer}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 min-h-[40px]"
                    onClick={() => onCopyText(item.answer)}
                  >
                    {t("applyAssistant.copyQuestionAnswer")}
                  </Button>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div
        className={cn(
          "fixed inset-x-0 z-50 border-t border-[var(--border-default)] bg-[var(--surface-1)]/95 p-3 backdrop-blur-md md:hidden",
          "mobile-sticky-above-nav"
        )}
      >
        <Button
          type="button"
          size="lg"
          className="min-h-[52px] w-full rounded-2xl bg-gradient-to-b from-[#7B8EFF] to-[#4D63E0] text-[16px] font-semibold text-white hover:from-[#8A9BFF] hover:to-[#5A72E8]"
          disabled={completeLoading}
          onClick={onMarkApplied}
        >
          {completeLoading ? "…" : t("labels.markAsApplied")}
        </Button>
      </div>

      <div className="hidden md:block">
        <Button
          type="button"
          size="lg"
          className="min-h-[52px] w-full rounded-2xl bg-gradient-to-b from-[#7B8EFF] to-[#4D63E0] text-[16px] font-semibold text-white"
          disabled={completeLoading}
          onClick={onMarkApplied}
        >
          {completeLoading ? "…" : t("labels.markAsApplied")}
        </Button>
      </div>
    </div>
  );
}
