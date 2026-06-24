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
  generateApplyAnswersFromScreenshot,
  getApplyDocumentStatus,
  shareApplyDocument,
  APPLY_ANSWER_LIMIT_PRESETS,
  type ApplyAnswerVariant,
  type ApplyCompleteStatus,
  type ApplyDocumentStatus,
  type GenerateAnswerOptions,
  type ScreenshotAnswerItem,
} from "@/lib/api/apply-assistant.api";
import { normalizeJobForUi } from "@/lib/utils/resource";
import { showError, showSuccess } from "@/lib/ui/toast";
import type { Job } from "@/types/job";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const CUSTOM_LIMIT_MIN = 50;
const CUSTOM_LIMIT_MAX = 2000;

function buildAnswerOptions(variant: ApplyAnswerVariant, maxCharacters: number): GenerateAnswerOptions {
  if (variant === "full") return { variant: "full" };
  return { variant: "compact", maxCharacters };
}

function clampCharacterLimit(value: number) {
  return Math.min(CUSTOM_LIMIT_MAX, Math.max(CUSTOM_LIMIT_MIN, Math.floor(value)));
}

function AnswerLengthSelector({
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
  const [answerVariant, setAnswerVariant] = useState<ApplyAnswerVariant>("compact");
  const [maxCharacters, setMaxCharacters] = useState(500);
  const [customLimit, setCustomLimit] = useState("");
  const [answerMode, setAnswerMode] = useState<"type" | "screenshot">("type");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotMediaType, setScreenshotMediaType] = useState("image/png");
  const [screenshotAnswers, setScreenshotAnswers] = useState<ScreenshotAnswerItem[]>([]);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
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

  const answerOptions = buildAnswerOptions(answerVariant, maxCharacters);

  const handlePresetSelect = useCallback((limit: number) => {
    setAnswerVariant("compact");
    setMaxCharacters(limit);
    setCustomLimit("");
  }, []);

  const handleVariantChange = useCallback((next: ApplyAnswerVariant) => {
    setAnswerVariant(next);
    if (next === "compact" && !maxCharacters) setMaxCharacters(500);
  }, [maxCharacters]);

  const handleCustomLimitChange = useCallback((value: string) => {
    setCustomLimit(value);
    const parsed = Number(value);
    if (!value.trim() || Number.isNaN(parsed)) return;
    setAnswerVariant("compact");
    setMaxCharacters(clampCharacterLimit(parsed));
  }, []);

  const handleGenerateAnswer = useCallback(async () => {
    if (!questionText.trim()) return;
    setAnswerLoading(true);
    try {
      const result = await generateApplyAnswer(id, questionText.trim(), answerOptions);
      setAnswer(result.answer);
    } catch (e) {
      showError(e instanceof ApiError ? e.message : "Generate answer failed");
    } finally {
      setAnswerLoading(false);
    }
  }, [id, questionText, answerOptions]);

  const handleScreenshotSelect = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const [, base64 = ""] = result.split(",");
      setScreenshotPreview(result);
      setScreenshotBase64(base64);
      setScreenshotMediaType(file.type || "image/png");
      setScreenshotAnswers([]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyzeScreenshot = useCallback(async () => {
    if (!screenshotBase64) return;
    setScreenshotLoading(true);
    try {
      const result = await generateApplyAnswersFromScreenshot(
        id,
        screenshotBase64,
        screenshotMediaType,
        answerOptions
      );
      setScreenshotAnswers(result.items);
      if (!result.items.length) showError("No questions found in screenshot");
    } catch (e) {
      showError(e instanceof ApiError ? e.message : "Screenshot analysis failed");
    } finally {
      setScreenshotLoading(false);
    }
  }, [id, screenshotBase64, screenshotMediaType, answerOptions]);

  const handleCopyText = useCallback(async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(t("applyAssistant.copySuccess"));
    } catch {
      showError("Copy failed");
    }
  }, [t]);

  const handleCopyAnswer = useCallback(async () => {
    await handleCopyText(answer);
  }, [answer, handleCopyText]);

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
            size="lg"
            className="w-full min-h-[44px]"
            disabled={docLoading !== null || missingCv}
            onClick={() => void handleDocument("cv")}
          >
            {docLoading === "cv" ? "…" : t("applyAssistant.copyCv")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full min-h-[44px]"
            disabled={docLoading !== null || missingCoverLetter}
            onClick={() => void handleDocument("cover_letter")}
          >
            {docLoading === "cover_letter" ? "…" : t("applyAssistant.copyCoverLetter")}
          </Button>
        </div>

        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAnswerMode("type")}
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
              onClick={() => setAnswerMode("screenshot")}
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
            onVariantChange={handleVariantChange}
            onPresetSelect={handlePresetSelect}
            onCustomLimitChange={handleCustomLimitChange}
            t={t}
          />

          {answerMode === "type" ? (
            <>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder={t("applyAssistant.questionPlaceholder")}
                rows={3}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-base text-[var(--text-1)]"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="lg"
                  className="flex-1 min-h-[44px]"
                  disabled={answerLoading || !questionText.trim()}
                  onClick={() => void handleGenerateAnswer()}
                >
                  {answerLoading ? "…" : answer ? t("applyAssistant.regenerateAnswer") : t("applyAssistant.generateAnswer")}
                </Button>
                {answer ? (
                  <Button type="button" variant="secondary" size="lg" className="min-h-[44px]" onClick={() => void handleCopyAnswer()}>
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
                  onChange={(e) => handleScreenshotSelect(e.target.files?.[0] ?? null)}
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
                className="w-full min-h-[44px]"
                disabled={screenshotLoading || !screenshotBase64}
                onClick={() => void handleAnalyzeScreenshot()}
              >
                {screenshotLoading ? t("applyAssistant.analyzingScreenshot") : t("applyAssistant.analyzeScreenshot")}
              </Button>
              {screenshotAnswers.length > 0 ? (
                <div className="space-y-3 border-t border-[var(--border-subtle)] pt-3">
                  <p className="text-sm font-semibold text-[var(--text-1)]">{t("applyAssistant.screenshotAnswersTitle")}</p>
                  {screenshotAnswers.map((item, index) => (
                    <article key={`${index}-${item.question.slice(0, 24)}`} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
                      <p className="text-xs font-semibold text-[var(--text-1)]">{item.question}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-2)]">{item.answer}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[var(--text-4)]">
                          {t("applyAssistant.characterCount").replace("{{count}}", String(item.characterCount))}
                          {answerVariant === "compact"
                            ? ` / ${t("applyAssistant.limitPreset").replace("{{count}}", String(item.maxCharacters ?? maxCharacters))}`
                            : ""}
                        </span>
                        <Button type="button" variant="outline" size="sm" onClick={() => void handleCopyText(item.answer)}>
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
            className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setSheetOpen(true)}
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
                  onClick={() => setCompleteStatus(value)}
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
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("applyAssistant.notesPlaceholder")}
              rows={3}
              className="mt-3 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-base"
            />
            <input
              value={proofDocumentId}
              onChange={(e) => setProofDocumentId(e.target.value)}
              placeholder={t("applyAssistant.proofDocumentId")}
              className="mt-2 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-base"
            />
            <div
              className="mt-4 flex gap-2"
              style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
            >
              <Button type="button" variant="outline" size="lg" className="min-h-[44px] flex-1" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="lg"
                className="min-h-[44px] flex-1"
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
