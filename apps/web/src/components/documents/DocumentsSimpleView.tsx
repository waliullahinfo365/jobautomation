"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";
import { SimplePageHeader } from "@/components/shared/SimplePageHeader";
import { SimplePageShell } from "@/components/shared/SimplePageShell";
import { DocumentsIcon } from "@/components/icons";
import { DocumentWalletCard } from "./DocumentWalletCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import type { DocumentRecord } from "@/types/document";
import type { UploadPayload } from "./UploadDocumentModal";
import { cn } from "@/lib/utils";

type SimpleTab = "myDocs" | "generated" | "uploads";

export interface DocumentsSimpleViewProps {
  documents: DocumentRecord[];
  activeCv: DocumentRecord | undefined;
  activeTemplate: DocumentRecord | undefined;
  onOpen: (record: DocumentRecord) => void;
  onReplace: (record: DocumentRecord) => void;
  onUpload: (type: UploadPayload["type"]) => void;
}

function isPortfolioDoc(
  doc: DocumentRecord,
  activeCvId?: string,
  activeTemplateId?: string
): boolean {
  if (doc.id === activeCvId || doc.id === activeTemplateId) return false;
  if (doc.type === "Cover Letter" || doc.type === "Research Document" || doc.type === "PDF Export") {
    return false;
  }
  if (doc.type === "Supporting Document" || doc.type === "Email Template" || doc.type === "AI Draft") {
    return true;
  }
  if (doc.type === "CV" || doc.type === "Cover Letter Template") return true;
  return false;
}

function Section({
  title,
  description,
  emptyTitle,
  emptyDescription,
  records,
  onOpen,
  onReplace,
  highlightFirst,
}: {
  title: string;
  description?: string;
  emptyTitle: string;
  emptyDescription: string;
  records: DocumentRecord[];
  onOpen: (record: DocumentRecord) => void;
  onReplace: (record: DocumentRecord) => void;
  highlightFirst?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--text-1)]">{title}</h2>
        {description ? <p className="mt-0.5 text-[13px] text-[var(--text-3)]">{description}</p> : null}
      </div>
      {records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--surface-2)] px-4 py-6 text-center">
          <p className="text-[14px] font-medium text-[var(--text-2)]">{emptyTitle}</p>
          <p className="mt-1 text-[13px] text-[var(--text-4)]">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((record, index) => (
            <DocumentWalletCard
              key={record.id}
              record={record}
              onOpen={onOpen}
              onReplace={onReplace}
              highlight={highlightFirst && index === 0}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function DocumentsSimpleView({
  documents,
  activeCv,
  activeTemplate,
  onOpen,
  onReplace,
  onUpload,
}: DocumentsSimpleViewProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<SimpleTab>("myDocs");
  const [uploadMenuOpen, setUploadMenuOpen] = useState(false);

  const activeCvId = activeCv?.id;
  const activeTemplateId = activeTemplate?.id;

  const portfolioDocs = useMemo(
    () => documents.filter((d) => isPortfolioDoc(d, activeCvId, activeTemplateId)),
    [documents, activeCvId, activeTemplateId]
  );
  const generatedCoverLetters = useMemo(
    () => documents.filter((d) => d.type === "Cover Letter"),
    [documents]
  );
  const researchDocs = useMemo(
    () => documents.filter((d) => d.type === "Research Document"),
    [documents]
  );

  const tabs: { id: SimpleTab; label: string }[] = [
    { id: "myDocs", label: t("documents.simple.tabMyDocs") },
    { id: "generated", label: t("documents.simple.tabGenerated") },
    { id: "uploads", label: t("documents.simple.tabUploads") },
  ];

  const uploadOptions: { type: UploadPayload["type"]; label: string; description: string }[] = [
    { type: "CV", label: t("documents.simple.uploadCv"), description: t("documents.simple.uploadCvDesc") },
    {
      type: "Cover Letter Template",
      label: t("documents.simple.uploadCoverTemplate"),
      description: t("documents.simple.uploadCoverTemplateDesc"),
    },
    {
      type: "Supporting Document",
      label: t("documents.simple.uploadPortfolio"),
      description: t("documents.simple.uploadPortfolioDesc"),
    },
  ];

  const showEmptyWallet =
    tab === "myDocs" &&
    !activeCv &&
    !activeTemplate &&
    portfolioDocs.length === 0 &&
    documents.length === 0;

  return (
    <SimplePageShell className={tab === "myDocs" || showEmptyWallet ? "pb-mobile-sticky" : undefined}>
      <SimplePageHeader
        title={t("documents.simple.title")}
        description={t("documents.simple.subtitle")}
      />

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--border-default)] bg-[var(--surface-2)] p-1 [-webkit-overflow-scrolling:touch]">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "flex min-h-[44px] min-w-[5.5rem] flex-1 items-center justify-center rounded-xl px-2 py-2.5 text-[12px] font-medium transition-colors sm:text-[13px]",
              tab === item.id
                ? "bg-[var(--surface-1)] text-[var(--text-1)] shadow-sm"
                : "text-[var(--text-3)] hover:text-[var(--text-2)]"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {showEmptyWallet ? (
        <EmptyState
          title={t("documents.simple.emptyWalletTitle")}
          description={t("documents.simple.emptyWalletDesc")}
          cta={{ label: t("labels.uploadDocument"), onClick: () => onUpload("CV") }}
          compact
        />
      ) : null}

      {tab === "myDocs" && !showEmptyWallet ? (
        <div className="space-y-6">
          <Section
            title={t("documents.simple.activeResume")}
            emptyTitle={t("documents.simple.noActiveResume")}
            emptyDescription={t("documents.simple.noActiveResumeDesc")}
            records={activeCv ? [activeCv] : []}
            onOpen={onOpen}
            onReplace={onReplace}
            highlightFirst
          />
          <Section
            title={t("documents.simple.coverTemplate")}
            emptyTitle={t("documents.simple.noCoverTemplate")}
            emptyDescription={t("documents.simple.noCoverTemplateDesc")}
            records={activeTemplate ? [activeTemplate] : []}
            onOpen={onOpen}
            onReplace={onReplace}
            highlightFirst
          />
          <Section
            title={t("documents.simple.portfolio")}
            description={t("documents.simple.portfolioDesc")}
            emptyTitle={t("documents.simple.noPortfolio")}
            emptyDescription={t("documents.simple.noPortfolioDesc")}
            records={portfolioDocs}
            onOpen={onOpen}
            onReplace={onReplace}
          />
        </div>
      ) : null}

      {tab === "generated" ? (
        <div className="space-y-6">
          <Section
            title={t("documents.simple.generatedCoverLetters")}
            description={t("documents.simple.generatedCoverLettersDesc")}
            emptyTitle={t("documents.simple.noGenerated")}
            emptyDescription={t("documents.simple.noGeneratedDesc")}
            records={generatedCoverLetters}
            onOpen={onOpen}
            onReplace={onReplace}
          />
          <Section
            title={t("documents.simple.researchDocs")}
            description={t("documents.simple.researchDocsDesc")}
            emptyTitle={t("documents.simple.noResearch")}
            emptyDescription={t("documents.simple.noResearchDesc")}
            records={researchDocs}
            onOpen={onOpen}
            onReplace={onReplace}
          />
        </div>
      ) : null}

      {tab === "uploads" ? (
        <div className="space-y-3">
          <p className="text-[14px] text-[var(--text-3)]">{t("documents.simple.uploadsIntro")}</p>
          {uploadOptions.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => onUpload(option.type)}
              className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-[var(--accent-hi)]">
                <DocumentsIcon size={18} />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-[var(--text-1)]">{option.label}</span>
                <span className="mt-0.5 block text-[13px] text-[var(--text-3)]">{option.description}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {tab === "myDocs" || showEmptyWallet ? (
      <div
        className={cn(
          "fixed inset-x-0 z-50 border-t border-[var(--border-default)] bg-[var(--surface-1)]/95 p-3 backdrop-blur-md md:hidden",
          "mobile-sticky-above-nav"
        )}
      >
        <Button
          type="button"
          size="lg"
          className="min-h-[52px] w-full rounded-2xl text-[16px] font-semibold"
          onClick={() => setUploadMenuOpen(true)}
        >
          {t("labels.uploadDocument")}
        </Button>
      </div>
      ) : null}

      {uploadMenuOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 md:items-center md:p-4">
          <div className="w-full max-w-md rounded-t-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4 shadow-xl md:rounded-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--border-subtle)] md:hidden" aria-hidden />
            <h3 className="text-base font-semibold text-[var(--text-1)]">{t("documents.simple.uploadDocument")}</h3>
            <div className="mt-3 space-y-2">
              {uploadOptions.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => {
                    setUploadMenuOpen(false);
                    onUpload(option.type);
                  }}
                  className="flex min-h-[52px] w-full items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 text-left text-[15px] font-medium text-[var(--text-1)]"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="mt-4 min-h-[44px] w-full"
              onClick={() => setUploadMenuOpen(false)}
            >
              {t("documents.upload.cancel")}
            </Button>
          </div>
        </div>
      ) : null}
    </SimplePageShell>
  );
}
