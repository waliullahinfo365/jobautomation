"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { UpgradeModal, type PaywallReason } from "@/components/billing/UpgradeModal";
import { ApplyAssistantAdvancedView } from "@/components/jobs/ApplyAssistantAdvancedView";
import { ApplyAssistantSimpleView } from "@/components/jobs/ApplyAssistantSimpleView";
import { useAdvancedUi } from "@/context/AuthSessionContext";
import { useTranslation } from "@/i18n/useTranslation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getJob } from "@/lib/api/jobs.api";
import {
  completeApplyAssistant,
  fetchApplyDocumentBlob,
  generateApplyAnswer,
  generateApplyAnswersFromScreenshot,
  getApplyDocumentStatus,
  shareApplyDocument,
  type ApplyAnswerVariant,
  type ApplyCompleteStatus,
  type ApplyDocumentStatus,
  type GenerateAnswerOptions,
  type ScreenshotAnswerItem,
} from "@/lib/api/apply-assistant.api";
import { normalizeJobForUi } from "@/lib/utils/resource";
import { copyTextToClipboard } from "@/lib/utils/mobile-apply";
import { showError, showSuccess } from "@/lib/ui/toast";
import type { Job } from "@/types/job";
import { ApiError } from "@/lib/api/client";

const CUSTOM_LIMIT_MIN = 50;
const CUSTOM_LIMIT_MAX = 2000;
const SIMPLE_ANSWER_MAX_CHARACTERS = 500;

function buildAnswerOptions(variant: ApplyAnswerVariant, maxCharacters: number): GenerateAnswerOptions {
  if (variant === "full") return { variant: "full" };
  return { variant: "compact", maxCharacters };
}

function clampCharacterLimit(value: number) {
  return Math.min(CUSTOM_LIMIT_MAX, Math.max(CUSTOM_LIMIT_MIN, Math.floor(value)));
}

function isBillingLimitError(e: unknown): boolean {
  if (!(e instanceof ApiError)) return false;
  return e.status === 402 || e.code === "PLAN_LIMIT" || e.code === "BILLING_REQUIRED";
}

export function ManualApplyAssistantClient() {
  const { t } = useTranslation();
  const advancedUi = useAdvancedUi();
  const isMobile = useIsMobile();
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");
  const coverCopiedRef = useRef(false);
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
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<PaywallReason>("ai_credits");
  const [answerError, setAnswerError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!id || !docStatus || coverCopiedRef.current || !isMobile || advancedUi) return;
    if (docStatus.missingDocuments.coverLetter) return;
    if (docStatus.coverLetter.delivery !== "content_text") return;

    coverCopiedRef.current = true;
    void fetchApplyDocumentBlob(id, "cover_letter")
      .then(async ({ blob }) => {
        const text = await blob.text();
        if (await copyTextToClipboard(text)) {
          showSuccess(t("applyAssistant.simple.coverLetterCopied"));
        }
      })
      .catch(() => void 0);
  }, [id, docStatus, isMobile, advancedUi, t]);

  const handleDocument = useCallback(
    async (role: "cv" | "cover_letter") => {
      if (role === "cv" && docStatus?.missingDocuments.cv) return;
      if (role === "cover_letter" && docStatus?.missingDocuments.coverLetter) return;
      setDocLoading(role);
      try {
        await shareApplyDocument(id, role);
        showSuccess(
          advancedUi ? t("applyAssistant.downloadSuccess") : t("applyAssistant.simple.downloadSuccess")
        );
      } catch (e) {
        showError(e instanceof ApiError ? e.message : "Download failed");
      } finally {
        setDocLoading(null);
      }
    },
    [id, t, docStatus, advancedUi]
  );

  const answerOptions = advancedUi
    ? buildAnswerOptions(answerVariant, maxCharacters)
    : buildAnswerOptions("compact", SIMPLE_ANSWER_MAX_CHARACTERS);

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
    setAnswerError(null);
    try {
      const result = await generateApplyAnswer(id, questionText.trim(), answerOptions);
      setAnswer(result.answer);
    } catch (e) {
      if (isBillingLimitError(e)) {
        setUpgradeReason("ai_credits");
        setUpgradeOpen(true);
      } else {
        const message = e instanceof ApiError ? e.message : "Generate answer failed";
        setAnswerError(message);
        showError(message);
      }
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
    setAnswerError(null);
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
      if (isBillingLimitError(e)) {
        setUpgradeReason("ai_credits");
        setUpgradeOpen(true);
      } else {
        const message = e instanceof ApiError ? e.message : "Screenshot analysis failed";
        setAnswerError(message);
        showError(message);
      }
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

  const completeApplication = useCallback(
    async (status: ApplyCompleteStatus, options?: { notes?: string; proofDocumentId?: string }) => {
      setCompleteLoading(true);
      try {
        const documentIds = [
          docStatus?.cv.documentId,
          docStatus?.coverLetter.documentId,
        ].filter((value): value is string => Boolean(value?.trim()));
        await completeApplyAssistant(id, {
          status,
          notes: options?.notes?.trim() || undefined,
          proofDocumentId: options?.proofDocumentId?.trim() || undefined,
          documentIds: documentIds.length ? documentIds : undefined,
        });
        showSuccess(
          advancedUi ? t("applyAssistant.completeSuccess") : t("applyAssistant.simple.markedAppliedSuccess")
        );
        setSheetOpen(false);
      } catch (e) {
        if (isBillingLimitError(e)) {
          setUpgradeReason("apply_assistant");
          setUpgradeOpen(true);
        } else {
          showError(e instanceof ApiError ? e.message : "Save failed");
        }
      } finally {
        setCompleteLoading(false);
      }
    },
    [id, docStatus, t, advancedUi]
  );

  const handleComplete = useCallback(async () => {
    await completeApplication(completeStatus, { notes, proofDocumentId });
  }, [completeApplication, completeStatus, notes, proofDocumentId]);

  const handleCompleteSimple = useCallback(async () => {
    await completeApplication("Applied");
  }, [completeApplication]);

  if (loading) {
    return <LoadingState title={t("applyAssistant.loading")} description="" />;
  }

  if (error || !job) {
    return (
      <ErrorState
        title={t("applyAssistant.notFound")}
        description={error ?? undefined}
        actionLabel={t("applyAssistant.backToJobs")}
        onAction={() => router.push(`/jobs/${id}`)}
      />
    );
  }

  const upgradeModal = (
    <UpgradeModal open={upgradeOpen} reason={upgradeReason} onClose={() => setUpgradeOpen(false)} />
  );

  const jobUrl = job.jobUrl ?? "";
  const missingCv = docStatus?.missingDocuments.cv ?? false;
  const missingCoverLetter = docStatus?.missingDocuments.coverLetter ?? false;
  const usesContentTextExport =
    docStatus?.cv.delivery === "content_text" || docStatus?.coverLetter.delivery === "content_text";

  if (advancedUi) {
    return (
      <>
        {upgradeModal}
        <ApplyAssistantAdvancedView
        job={job}
        jobUrl={jobUrl}
        docStatus={docStatus}
        missingCv={missingCv}
        missingCoverLetter={missingCoverLetter}
        usesContentTextExport={usesContentTextExport}
        docLoading={docLoading}
        answerMode={answerMode}
        onAnswerModeChange={setAnswerMode}
        answerVariant={answerVariant}
        maxCharacters={maxCharacters}
        customLimit={customLimit}
        onVariantChange={handleVariantChange}
        onPresetSelect={handlePresetSelect}
        onCustomLimitChange={handleCustomLimitChange}
        questionText={questionText}
        onQuestionChange={setQuestionText}
        answer={answer}
        answerLoading={answerLoading}
        onGenerateAnswer={() => void handleGenerateAnswer()}
        onCopyAnswer={() => void handleCopyAnswer()}
        screenshotPreview={screenshotPreview}
        screenshotLoading={screenshotLoading}
        screenshotAnswers={screenshotAnswers}
        hasScreenshot={Boolean(screenshotBase64)}
        onScreenshotSelect={handleScreenshotSelect}
        onAnalyzeScreenshot={() => void handleAnalyzeScreenshot()}
        onCopyText={(text) => void handleCopyText(text)}
        onOpenCv={() => void handleDocument("cv")}
        onOpenCoverLetter={() => void handleDocument("cover_letter")}
        sheetOpen={sheetOpen}
        onSheetOpenChange={setSheetOpen}
        completeStatus={completeStatus}
        onCompleteStatusChange={setCompleteStatus}
        notes={notes}
        onNotesChange={setNotes}
        proofDocumentId={proofDocumentId}
        onProofDocumentIdChange={setProofDocumentId}
        completeLoading={completeLoading}
        onComplete={() => void handleComplete()}
      />
      </>
    );
  }

  return (
    <>
      {upgradeModal}
      {answerError ? (
        <div className="mb-4 rounded-xl border border-[var(--rose-ring)] bg-[var(--rose-bg)] px-4 py-3 text-[13px] text-[var(--text-2)]">
          {answerError}
        </div>
      ) : null}
      <ApplyAssistantSimpleView
      job={job}
      jobUrl={jobUrl || null}
      missingCv={missingCv}
      missingCoverLetter={missingCoverLetter}
      docLoading={docLoading}
      questionText={questionText}
      onQuestionChange={setQuestionText}
      answer={answer}
      answerLoading={answerLoading}
      screenshotPreview={screenshotPreview}
      screenshotLoading={screenshotLoading}
      screenshotAnswers={screenshotAnswers}
      completeLoading={completeLoading}
      onOpenCv={() => void handleDocument("cv")}
      onOpenCoverLetter={() => void handleDocument("cover_letter")}
      onGenerateAnswer={() => void handleGenerateAnswer()}
      onCopyAnswer={() => void handleCopyAnswer()}
      onScreenshotSelect={handleScreenshotSelect}
      onAnalyzeScreenshot={() => void handleAnalyzeScreenshot()}
      onCopyText={(text) => void handleCopyText(text)}
      onMarkApplied={() => void handleCompleteSimple()}
      hasScreenshot={Boolean(screenshotBase64)}
    />
    </>
  );
}
