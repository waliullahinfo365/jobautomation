"use client";

import type { ApplyAnswerVariant, ApplyCompleteStatus, ApplyDocumentStatus, ScreenshotAnswerItem } from "@/lib/api/apply-assistant.api";
import { APPLY_ANSWER_LIMIT_PRESETS } from "@/lib/api/apply-assistant.api";
import type { Job } from "@/types/job";
import { PageHeader } from "@/components/shared/PageHeader";
import { JobsIcon } from "@/components/icons";
import { MissingDocumentCard } from "@/components/jobs/apply-assistant-shared";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

const CUSTOM_LIMIT_MIN = 50;
const CUSTOM_LIMIT_MAX = 2000;

export function AnswerLengthSelector({
  variant,
  maxCharacters,
  customLimit,
  onVariantChange,
  onPresetSelect,
  onCustomLimitChange,
  t,
}: {
  variant: ApplyAnswerVariant;
  maxCharacters: number;
  customLimit: string;
  onVariantChange: (variant: ApplyAnswerVariant) => void;
  onPresetSelect: (limit: number) => void;
  onCustomLimitChange: (value: string) => void;
  t: (key: string) => string;
}) {
  const isPresetActive = (limit: number) => variant === "compact" && maxCharacters === limit && !customLimit;

  return (
    <div className="space-y-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
      <p className="text-xs font-medium text-[var(--text-2)]">{t("applyAssistant.answerLengthLabel")}</p>
      <p className="text-[11px] leading-relaxed text-[var(--text-4)]">{t("applyAssistant.limitHint")}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onVariantChange("full")}
          className={cn(
            "min-h-[40px] rounded-full border px-3 py-1.5 text-xs font-medium",
            variant === "full"
              ? "border-[var(--accent-hi)] bg-[var(--accent-bg)] text-[var(--accent-hi)]"
              : "border-[var(--border-subtle)] text-[var(--text-3)]"
          )}
        >
          {t("applyAssistant.fullAnswer")}
        </button>
        {APPLY_ANSWER_LIMIT_PRESETS.map((limit) => (
          <button
            key={limit}
            type="button"
            onClick={() => onPresetSelect(limit)}
            className={cn(
              "min-h-[40px] rounded-full border px-3 py-1.5 text-xs font-medium",
              isPresetActive(limit)
                ? "border-[var(--accent-hi)] bg-[var(--accent-bg)] text-[var(--accent-hi)]"
                : "border-[var(--border-subtle)] text-[var(--text-3)]"
            )}
          >
            {t("applyAssistant.limitPreset").replace("{{count}}", String(limit))}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="shrink-0 text-xs text-[var(--text-3)]" htmlFor="apply-custom-limit">
          {t("applyAssistant.customLimit")}
        </label>
        <input
          id="apply-custom-limit"
          type="number"
          min={CUSTOM_LIMIT_MIN}
          max={CUSTOM_LIMIT_MAX}
          inputMode="numeric"
          value={customLimit}
          onChange={(e) => onCustomLimitChange(e.target.value)}
          placeholder={t("applyAssistant.customLimitPlaceholder")}
          className="h-11 min-h-[44px] w-full max-w-[8rem] rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-base text-[var(--text-1)]"
        />
        {variant === "compact" ? (
          <span className="text-xs text-[var(--text-4)]">
            {t("applyAssistant.limitChars").replace("{{count}}", String(maxCharacters))}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export interface ApplyAssistantAdvancedViewProps {
  job: Job;
  jobUrl: string;
  docStatus: ApplyDocumentStatus | null;
  missingCv: boolean;
  missingCoverLetter: boolean;
  usesContentTextExport: boolean;
  docLoading: "cv" | "cover_letter" | null;
  answerMode: "type" | "screenshot";
  onAnswerModeChange: (mode: "type" | "screenshot") => void;
  answerVariant: ApplyAnswerVariant;
  maxCharacters: number;
  customLimit: string;
  onVariantChange: (variant: ApplyAnswerVariant) => void;
  onPresetSelect: (limit: number) => void;
  onCustomLimitChange: (value: string) => void;
  questionText: string;
  onQuestionChange: (value: string) => void;
  answer: string;
  answerLoading: boolean;
  onGenerateAnswer: () => void;
  onCopyAnswer: () => void;
  screenshotPreview: string | null;
  screenshotLoading: boolean;
  screenshotAnswers: ScreenshotAnswerItem[];
  hasScreenshot: boolean;
  onScreenshotSelect: (file: File | null) => void;
  onAnalyzeScreenshot: () => void;
  onCopyText: (text: string) => void;
  onOpenCv: () => void;
  onOpenCoverLetter: () => void;
  sheetOpen: boolean;
  onSheetOpenChange: (open: boolean) => void;
  completeStatus: ApplyCompleteStatus;
  onCompleteStatusChange: (status: ApplyCompleteStatus) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  proofDocumentId: string;
  onProofDocumentIdChange: (value: string) => void;
  completeLoading: boolean;
  onComplete: () => void;
}

export function ApplyAssistantAdvancedView({
  job,
  jobUrl,
  missingCv,
  missingCoverLetter,
  usesContentTextExport,
  docLoading,
  answerMode,
  onAnswerModeChange,
  answerVariant,
  maxCharacters,
  customLimit,
  onVariantChange,
  onPresetSelect,
  onCustomLimitChange,
  questionText,
  onQuestionChange,
  answer,
  answerLoading,
  onGenerateAnswer,
  onCopyAnswer,
  screenshotPreview,
  screenshotLoading,
  screenshotAnswers,
  hasScreenshot,
  onScreenshotSelect,
  onAnalyzeScreenshot,
  onCopyText,
  onOpenCv,
  onOpenCoverLetter,
  sheetOpen,
  onSheetOpenChange,
  completeStatus,
  onCompleteStatusChange,
  notes,
  onNotesChange,
  proofDocumentId,
  onProofDocumentIdChange,
  completeLoading,
  onComplete,
}: ApplyAssistantAdvancedViewProps) {
  const { t } = useTranslation();

  return (
    <div className="pb-mobile-sticky">
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

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-[44px] w-full"
            disabled={docLoading !== null || missingCv}
            onClick={onOpenCv}
          >
            {docLoading === "cv" ? "…" : t("applyAssistant.copyCv")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-[44px] w-full"
            disabled={docLoading !== null || missingCoverLetter}
            onClick={onOpenCoverLetter}
          >
            {docLoading === "cover_letter" ? "…" : t("applyAssistant.copyCoverLetter")}
          </Button>
        </div>

        <div className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onAnswerModeChange("type")}
              className={cn(
                "min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                answerMode === "type"
                  ? "border-[var(--accent-hi)] bg-[var(--accent-bg)] text-[var(--accent-hi)]"
                  : "border-[var(--border-subtle)] text-[var(--text-2)]"
              )}
            >
              {t("applyAssistant.answerModeType")}
            </button>
            <button
              type="button"
              onClick={() => onAnswerModeChange("screenshot")}
              className={cn(
                "min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                answerMode === "screenshot"
                  ? "border-[var(--accent-hi)] bg-[var(--accent-bg)] text-[var(--accent-hi)]"
                  : "border-[var(--border-subtle)] text-[var(--text-2)]"
              )}
            >
              {t("applyAssistant.answerModeScreenshot")}
            </button>
          </div>

          <AnswerLengthSelector
            variant={answerVariant}
            maxCharacters={maxCharacters}
            customLimit={customLimit}
            onVariantChange={onVariantChange}
            onPresetSelect={onPresetSelect}
            onCustomLimitChange={onCustomLimitChange}
            t={t}
          />

          {answerMode === "type" ? (
            <>
              <textarea
                value={questionText}
                onChange={(e) => onQuestionChange(e.target.value)}
                placeholder={t("applyAssistant.questionPlaceholder")}
                rows={3}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-base text-[var(--text-1)]"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="lg"
                  className="min-h-[44px] flex-1"
                  disabled={answerLoading || !questionText.trim()}
                  onClick={onGenerateAnswer}
                >
                  {answerLoading ? "…" : answer ? t("applyAssistant.regenerateAnswer") : t("applyAssistant.generateAnswer")}
                </Button>
                {answer ? (
                  <Button type="button" variant="secondary" size="lg" className="min-h-[44px]" onClick={onCopyAnswer}>
                    {t("applyAssistant.copyAnswer")}
                  </Button>
                ) : null}
              </div>
              {answer ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-4)]">
                    <span className="rounded-full bg-[var(--accent-bg)] px-2 py-0.5 font-medium text-[var(--accent-hi)]">
                      {answerVariant === "compact"
                        ? t("applyAssistant.compactBadge").replace("{{count}}", String(maxCharacters))
                        : t("applyAssistant.fullAnswer")}
                    </span>
                    <span>{t("applyAssistant.characterCount").replace("{{count}}", String(answer.length))}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-2)]">{answer}</p>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-xs leading-relaxed text-[var(--text-3)]">{t("applyAssistant.screenshotHint")}</p>
              <label className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--surface-2)] px-4 py-3 text-sm font-medium text-[var(--text-2)]">
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
                  className="max-h-48 w-full rounded-lg border border-[var(--border-subtle)] object-contain bg-[var(--surface-2)]"
                />
              ) : (
                <p className="text-xs text-[var(--text-4)]">{t("applyAssistant.noScreenshotSelected")}</p>
              )}
              <Button
                type="button"
                size="lg"
                className="min-h-[44px] w-full"
                disabled={screenshotLoading || !hasScreenshot}
                onClick={onAnalyzeScreenshot}
              >
                {screenshotLoading ? t("applyAssistant.analyzingScreenshot") : t("applyAssistant.analyzeScreenshot")}
              </Button>
              {screenshotAnswers.length > 0 ? (
                <div className="space-y-3 border-t border-[var(--border-subtle)] pt-3">
                  <p className="text-sm font-semibold text-[var(--text-1)]">{t("applyAssistant.screenshotAnswersTitle")}</p>
                  {screenshotAnswers.map((item, index) => (
                    <article
                      key={`${index}-${item.question.slice(0, 24)}`}
                      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3"
                    >
                      <p className="text-xs font-semibold text-[var(--text-1)]">{item.question}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-2)]">{item.answer}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[var(--text-4)]">
                          {t("applyAssistant.characterCount").replace("{{count}}", String(item.characterCount))}
                          {answerVariant === "compact"
                            ? ` / ${t("applyAssistant.limitPreset").replace("{{count}}", String(item.maxCharacters ?? maxCharacters))}`
                            : ""}
                        </span>
                        <Button type="button" variant="outline" size="sm" onClick={() => onCopyText(item.answer)}>
                          {t("applyAssistant.copyQuestionAnswer")}
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 z-50 border-t border-[var(--border-default)] bg-[var(--surface-1)] p-3",
          "mobile-sticky-above-nav md:left-[var(--sidebar-width,0px)]"
        )}
      >
        <div className="mx-auto max-w-lg">
          <Button
            type="button"
            size="lg"
            className="min-h-[44px] w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={() => onSheetOpenChange(true)}
          >
            {t("applyAssistant.completeTitle")}
          </Button>
        </div>
      </div>

      {sheetOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 md:items-center md:p-4">
          <div className="w-full max-w-md rounded-t-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-xl md:rounded-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--border-subtle)] md:hidden" aria-hidden />
            <h3 className="text-base font-semibold text-[var(--text-1)]">{t("applyAssistant.completeTitle")}</h3>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                  onClick={() => onCompleteStatusChange(value)}
                  className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm ${
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
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder={t("applyAssistant.notesPlaceholder")}
              rows={3}
              className="mt-3 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-base"
            />
            <input
              value={proofDocumentId}
              onChange={(e) => onProofDocumentIdChange(e.target.value)}
              placeholder={t("applyAssistant.proofDocumentId")}
              className="mt-2 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-base"
            />
            <div className="mt-4 flex gap-2" style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}>
              <Button type="button" variant="outline" size="lg" className="min-h-[44px] flex-1" onClick={() => onSheetOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" size="lg" className="min-h-[44px] flex-1" disabled={completeLoading} onClick={onComplete}>
                {completeLoading ? "…" : t("applyAssistant.completeSubmit")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
