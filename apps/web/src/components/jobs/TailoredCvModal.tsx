"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateTailoredCv, getTailoredCv, type TailoredCvData } from "@/lib/api/jobs.api";
import { showError, showSuccess } from "@/lib/ui/toast";
import { cn } from "@/lib/utils";
import { CV_TEMPLATE_OPTIONS } from "@/lib/cv-templates/types";
import type { CvTemplateId } from "@/lib/cv-templates/types";
import { useTranslation } from "@/i18n/useTranslation";

// Client-side only — @react-pdf/renderer cannot run on the server
const CvPdfClientDownload = dynamic(
  () => import("./CvPdfClientDownload"),
  { ssr: false, loading: () => <button className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white opacity-60 cursor-wait">Preparing PDF…</button> }
);

type Tab = "cv" | "cover-letter" | "ats";

// ── Cover letter PDF download button ─────────────────────────────────────────

function CoverLetterPdfDownloadButton({
  jobId,
  style,
  personalInfo,
  company,
}: {
  jobId: string;
  style: "modern" | "classic";
  personalInfo: { fullName: string; email: string; phone: string; location: string; linkedIn: string };
  company: string;
}) {
  const [loading, setLoading] = useState(false);
  const download = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/cover-letter-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style, ...personalInfo }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => `Server error ${res.status}`));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cover-letter-${company.replace(/\s+/g, "-")}.pdf`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      showError("Cover letter PDF generation failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button onClick={() => void download()} disabled={loading} className="w-full">
      {loading ? "Generating PDF…" : "⬇ Download Cover Letter PDF"}
    </Button>
  );
}

function AtsScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--text-2)]">{label}</span>
        <span className="font-semibold text-[var(--text-1)]">{score}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function TemplatePreview({ id }: { id: string }) {
  const isModern = id.startsWith("modern");
  const hasPhoto = id.endsWith("with-photo");
  return (
    <svg viewBox="0 0 120 160" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      {/* Page background */}
      <rect width="120" height="160" rx="3" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
      {isModern ? (
        <>
          {/* Sidebar */}
          <rect x="0" y="0" width="38" height="160" rx="3" fill="#1a56db" opacity="0.85" />
          {hasPhoto && <circle cx="19" cy="22" r="11" fill="white" opacity="0.4" />}
          <rect x="5" y={hasPhoto ? "40" : "12"} width="28" height="3" rx="1.5" fill="white" opacity="0.7" />
          <rect x="5" y={hasPhoto ? "47" : "19"} width="20" height="2" rx="1" fill="white" opacity="0.5" />
          <rect x="5" y={hasPhoto ? "56" : "28"} width="16" height="2" rx="1" fill="white" opacity="0.4" />
          <rect x="5" y={hasPhoto ? "62" : "34"} width="22" height="2" rx="1" fill="white" opacity="0.4" />
          <rect x="5" y={hasPhoto ? "68" : "40"} width="18" height="2" rx="1" fill="white" opacity="0.4" />
          {/* Main content */}
          <rect x="46" y="14" width="64" height="4" rx="2" fill="#1a56db" opacity="0.8" />
          <rect x="46" y="22" width="48" height="2.5" rx="1.25" fill="#374151" opacity="0.6" />
          <rect x="46" y="28" width="54" height="2" rx="1" fill="#6b7280" opacity="0.5" />
          <rect x="46" y="32" width="46" height="2" rx="1" fill="#6b7280" opacity="0.5" />
          <rect x="46" y="42" width="30" height="3" rx="1.5" fill="#1a56db" opacity="0.6" />
          <rect x="46" y="49" width="56" height="2" rx="1" fill="#6b7280" opacity="0.4" />
          <rect x="46" y="54" width="52" height="2" rx="1" fill="#6b7280" opacity="0.4" />
          <rect x="46" y="59" width="48" height="2" rx="1" fill="#6b7280" opacity="0.4" />
        </>
      ) : (
        <>
          {/* Classic single-column */}
          {hasPhoto && <rect x="88" y="10" width="24" height="28" rx="3" fill="#d1d5db" opacity="0.6" />}
          <rect x="10" y="14" width="60" height="5" rx="2.5" fill="#111827" opacity="0.8" />
          <rect x="10" y="23" width="44" height="2.5" rx="1.25" fill="#1a56db" opacity="0.7" />
          <rect x="10" y="29" width="95" height="1.5" rx="0.75" fill="#d1d5db" />
          <rect x="10" y="34" width="25" height="3" rx="1.5" fill="#111827" opacity="0.7" />
          <rect x="10" y="41" width="100" height="2" rx="1" fill="#6b7280" opacity="0.5" />
          <rect x="10" y="46" width="90" height="2" rx="1" fill="#6b7280" opacity="0.5" />
          <rect x="10" y="51" width="80" height="2" rx="1" fill="#6b7280" opacity="0.5" />
          <rect x="10" y="59" width="100" height="1.5" rx="0.75" fill="#d1d5db" />
          <rect x="10" y="64" width="25" height="3" rx="1.5" fill="#111827" opacity="0.7" />
          <rect x="10" y="71" width="70" height="2" rx="1" fill="#6b7280" opacity="0.4" />
          <rect x="10" y="76" width="65" height="2" rx="1" fill="#6b7280" opacity="0.4" />
        </>
      )}
    </svg>
  );
}

interface Props {
  jobId: string;
  jobTitle: string;
  company: string;
  isOpen: boolean;
  onClose: () => void;
  initialData?: TailoredCvData | null;
}

export function TailoredCvModal({ jobId, jobTitle, company, isOpen, onClose, initialData }: Props) {
  const { t: tr } = useTranslation();
  const [tab, setTab] = useState<Tab>("cv");
  const [data, setData] = useState<TailoredCvData | null>(initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [userInstructions, setUserInstructions] = useState("");
  const [copied, setCopied] = useState<"cv" | "cl" | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CvTemplateId>("modern-no-photo");
  const [downloading, setDownloading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({ fullName: "", email: "", phone: "", location: "", linkedIn: "" });

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const result = await generateTailoredCv(jobId, { userInstructions: userInstructions || undefined });
      if (result) setData(result);
    } catch {
      showError(tr("jobs.tailoredCvModal.tailorFailedToast"));
      // Attempt to fetch whatever was saved
      try {
        const saved = await getTailoredCv(jobId);
        if (saved) setData(saved);
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, [jobId, userInstructions, tr]);

  const handleDownloadPdf = useCallback(async () => {
    if (!data) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/cv-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate,
          data: {
            fullName: personalInfo.fullName || "Your Name",
            email: personalInfo.email,
            phone: personalInfo.phone,
            location: personalInfo.location,
            linkedIn: personalInfo.linkedIn,
            headline: data.headline,
            summary: data.summary,
            skills: data.keywords,
            experience: data.bullets ?? [],
          },
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(errText || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CV-${company.replace(/\s+/g, "-")}.pdf`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showSuccess("PDF downloaded!");
    } catch (err) {
      showError(err instanceof Error ? err.message : "PDF generation failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [data, jobId, selectedTemplate, personalInfo, company]);

  const copyToClipboard = useCallback((text: string, which: "cv" | "cl") => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  const hasData =
    data?.status === "Completed" &&
    Boolean(
      (data.headline && data.headline.trim()) ||
        (data.summary && data.summary.trim()) ||
        (data.coverLetter && data.coverLetter.trim()) ||
        (data.bullets && data.bullets.some((s) => (s.bullets?.length ?? 0) > 0)) ||
        (data.keywords && data.keywords.length > 0) ||
        (data.missingKeywords && data.missingKeywords.length > 0) ||
        data.atsScoreBefore != null ||
        data.atsScoreAfter != null
    );
  const isFailed = data?.status === "Failed";

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "cv", label: tr("jobs.tailoredCvModal.tabCv") },
    { id: "cover-letter", label: tr("jobs.tailoredCvModal.tabCoverLetter") },
    { id: "ats", label: tr("jobs.tailoredCvModal.tabAts") },
  ];

  const cvText = hasData
    ? [
        data.headline ? `**${data.headline}**` : "",
        "",
        data.summary ?? "",
        "",
        ...(data.bullets ?? []).flatMap((section) => [
          `### ${section.role}`,
          ...(section.bullets ?? []).map((b) => `• ${b}`),
          "",
        ]),
      ]
        .join("\n")
        .trim()
    : "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${tr("jobs.tailoredCvModal.titlePrefix")} ${company} · ${jobTitle}`}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        {/* Generate panel */}
        {!hasData && (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4 space-y-3">
            {isFailed && data.error && (
              <p className="text-sm text-red-500">{data.error}</p>
            )}
            <div className="rounded-lg border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/25 p-3 space-y-2 text-sm text-[var(--text-2)]">
              <p className="font-semibold text-[var(--text-1)]">{tr("jobs.tailoredCvGuide.title")}</p>
              <ul className="list-disc pl-4 space-y-1.5">
                <li>{tr("jobs.tailoredCvGuide.bulletQuickReview")}</li>
                <li>{tr("jobs.tailoredCvGuide.bulletAi")}</li>
                <li>{tr("jobs.tailoredCvGuide.bulletPdf")}</li>
                <li>{tr("jobs.tailoredCvGuide.bulletCover")}</li>
                <li>{tr("jobs.tailoredCvGuide.bulletAtsMaster")}</li>
              </ul>
              <p className="font-semibold text-[var(--text-1)] pt-1">{tr("jobs.tailoredCvGuide.getStartedTitle")}</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>{tr("jobs.tailoredCvGuide.getStarted1")}</li>
                <li>{tr("jobs.tailoredCvGuide.getStarted2")}</li>
              </ul>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/documents" className="text-sm font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700">
                  {tr("jobs.tailoredCvGuide.linkDocuments")}
                </Link>
                <Link href="/jobs/review" className="text-sm font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700">
                  {tr("jobs.tailoredCvGuide.linkQuickReview")}
                </Link>
              </div>
            </div>
            <p className="text-sm text-[var(--text-2)]">{tr("jobs.tailoredCvModal.generateIntro")}</p>
            <textarea
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-1)] px-3 py-2 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={2}
              placeholder={tr("jobs.tailoredCvModal.optionalPlaceholder")}
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
            />
            <Button onClick={() => void handleGenerate()} disabled={loading} className="w-full">
              {loading
                ? tr("jobs.tailoredCvModal.generateButtonLoading")
                : isFailed
                  ? tr("jobs.tailoredCvModal.retryButton")
                  : tr("jobs.tailoredCvModal.generateButton")}
            </Button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-sm text-[var(--text-2)]">{tr("jobs.tailoredCvModal.generatingWait")}</span>
          </div>
        )}

        {/* Results */}
        {hasData && !loading && (
          <>
            {/* Regenerate bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                className="flex-1 min-w-0 rounded-lg border border-[var(--border-default)] bg-[var(--bg-1)] px-3 py-1.5 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Add instructions and regenerate…"
                value={userInstructions}
                onChange={(e) => setUserInstructions(e.target.value)}
              />
              <Button size="sm" variant="outline" onClick={() => void handleGenerate()} disabled={loading}>
                Regenerate
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] p-1">
              {tabs.map((tabItem) => (
                <button
                  key={tabItem.id}
                  onClick={() => setTab(tabItem.id)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                    tab === tabItem.id
                      ? "bg-[var(--bg-1)] text-[var(--text-1)] shadow-sm"
                      : "text-[var(--text-3)] hover:text-[var(--text-2)]"
                  )}
                >
                  {tabItem.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {tab === "cv" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[var(--text-1)]">Tailored Content</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(cvText, "cv")}
                      >
                        {copied === "cv" ? "Copied!" : "Copy all"}
                      </Button>
                    </div>

                    {/* Personal info for PDF */}
                    <details className="rounded-lg border border-[var(--border-default)]">
                      <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-[var(--text-2)] hover:bg-[var(--surface-2)] rounded-lg">
                        Personal info for PDF (name, contact) ›
                      </summary>
                      <div className="grid grid-cols-2 gap-2 p-3 pt-2">
                        {(["fullName", "email", "phone", "location", "linkedIn"] as const).map((field) => (
                          <input
                            key={field}
                            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-1)] px-2 py-1.5 text-xs text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder={{ fullName: "Full Name", email: "Email", phone: "Phone", location: "City, Country", linkedIn: "LinkedIn URL" }[field]}
                            value={personalInfo[field]}
                            onChange={(e) => setPersonalInfo((p) => ({ ...p, [field]: e.target.value }))}
                          />
                        ))}
                      </div>
                    </details>

                    {/* Template picker + download */}
                    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] p-3 space-y-2">
                      <p className="text-xs font-semibold text-[var(--text-2)]">Choose template &amp; download</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {CV_TEMPLATE_OPTIONS.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTemplate(t.id)}
                            className={cn(
                              "rounded-lg border px-2.5 py-2 text-left text-xs transition-all relative group",
                              selectedTemplate === t.id
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700"
                                : "border-[var(--border-default)] text-[var(--text-2)] hover:border-blue-400"
                            )}
                          >
                            <span className="font-semibold">{t.label}</span>
                            <br />
                            <span className="text-[10px] opacity-70">{t.description}</span>
                            {/* Preview tooltip on hover/long-press */}
                            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:flex flex-col items-center">
                              <span className="bg-[var(--bg-1)] border border-[var(--border-default)] rounded-lg shadow-xl p-2 w-36">
                                <TemplatePreview id={t.id} />
                              </span>
                              <span className="w-2 h-2 bg-[var(--bg-1)] border-r border-b border-[var(--border-default)] rotate-45 -mt-1" />
                            </span>
                          </button>
                        ))}
                      </div>
                      <CvPdfClientDownload
                        jobId={jobId}
                        templateId={selectedTemplate}
                        filename={`CV-${company.replace(/\s+/g, "-")}.pdf`}
                        data={{
                          fullName: personalInfo.fullName || "Your Name",
                          email: personalInfo.email,
                          phone: personalInfo.phone,
                          location: personalInfo.location,
                          linkedIn: personalInfo.linkedIn,
                          headline: data.headline ?? "",
                          summary: data.summary ?? "",
                          skills: data.keywords ?? [],
                          experience: (data.bullets ?? []) as never[],
                        }}
                      />
                    </div>

                    {data.headline && (
                      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">Headline</p>
                        <p className="text-sm font-semibold text-[var(--text-1)]">{data.headline}</p>
                      </div>
                    )}

                    {data.summary && (
                      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)] mb-1">Summary</p>
                        <p className="text-sm text-[var(--text-2)] leading-relaxed">{data.summary}</p>
                      </div>
                    )}

                    {(data.bullets ?? []).length > 0 && (
                      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] p-3 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Key Experience Bullets</p>
                        {(data.bullets ?? []).map((section, i) => (
                          <div key={i}>
                            <p className="text-xs font-semibold text-[var(--text-2)] mb-1">{section.role}</p>
                            <ul className="space-y-1">
                              {section.bullets.map((b, j) => (
                                <li key={j} className="text-sm text-[var(--text-2)] pl-3 border-l-2 border-[var(--border-default)]">
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === "cover-letter" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--text-1)]">Cover Letter</h3>
                        {data.coverLetterSubject && (
                          <p className="text-xs text-[var(--text-3)]">Subject: {data.coverLetterSubject}</p>
                        )}
                      </div>
                      {data.coverLetter && (
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(data.coverLetter!, "cl")}>
                          {copied === "cl" ? "Copied!" : "Copy text"}
                        </Button>
                      )}
                    </div>

                    {/* Styled preview */}
                    {data.coverLetter && (
                      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-1)] p-5 space-y-4 max-h-80 overflow-y-auto">
                        <div className="border-b border-[var(--border-default)] pb-3">
                          <p className="font-bold text-[var(--text-1)]">{personalInfo.fullName || "Your Name"}</p>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-[var(--text-3)]">
                            {personalInfo.email    && <span>{personalInfo.email}</span>}
                            {personalInfo.phone    && <span>{personalInfo.phone}</span>}
                            {personalInfo.location && <span>{personalInfo.location}</span>}
                          </div>
                        </div>
                        <div className="text-xs text-[var(--text-3)]">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
                        <div className="text-xs text-[var(--text-2)]">
                          <p className="font-semibold">{company}</p>
                          <p>Re: {jobTitle}</p>
                        </div>
                        {data.coverLetterSubject && (
                          <p className="text-sm font-semibold text-[var(--text-1)] underline">{data.coverLetterSubject}</p>
                        )}
                        <div className="space-y-3">
                          {data.coverLetter.split(/\n{2,}|\n/).filter(Boolean).map((para, i) => (
                            <p key={i} className="text-sm text-[var(--text-2)] leading-relaxed">{para}</p>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-[var(--border-default)]">
                          <p className="text-sm text-[var(--text-2)]">Yours sincerely,</p>
                          <p className="text-sm font-bold text-[var(--text-1)] mt-4">{personalInfo.fullName || "Your Name"}</p>
                        </div>
                      </div>
                    )}

                    {/* PDF download with style selector */}
                    {data.coverLetter && (
                      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] p-3 space-y-2">
                        <p className="text-xs font-semibold text-[var(--text-2)]">Download as PDF</p>
                        <div className="flex gap-2">
                          {(["modern", "classic"] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => setSelectedTemplate(s === "modern" ? "modern-no-photo" : "classic-no-photo")}
                              className={cn(
                                "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                                (s === "modern" ? selectedTemplate === "modern-no-photo" || selectedTemplate === "modern-with-photo" : selectedTemplate === "classic-no-photo" || selectedTemplate === "classic-with-photo")
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700"
                                  : "border-[var(--border-default)] text-[var(--text-2)] hover:border-blue-400"
                              )}
                            >
                              {s === "modern" ? "Modern (colour header)" : "Classic (minimal)"}
                            </button>
                          ))}
                        </div>
                        <CoverLetterPdfDownloadButton
                          jobId={jobId}
                          style={selectedTemplate.startsWith("modern") ? "modern" : "classic"}
                          personalInfo={personalInfo}
                          company={company}
                        />
                      </div>
                    )}

                    {!data.coverLetter && (
                      <p className="text-sm text-[var(--text-3)]">No cover letter generated yet.</p>
                    )}
                  </div>
                )}

                {tab === "ats" && (
                  <div className="space-y-4">
                    <div className="space-y-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">ATS Match Score</p>
                      {data.atsScoreBefore != null && (
                        <AtsScoreBar label="Original CV" score={data.atsScoreBefore} color="bg-amber-400" />
                      )}
                      {data.atsScoreAfter != null && (
                        <AtsScoreBar label="Tailored CV" score={data.atsScoreAfter} color="bg-green-500" />
                      )}
                      {data.atsScoreBefore != null && data.atsScoreAfter != null && (
                        <p className="text-xs text-green-600 font-medium">
                          +{data.atsScoreAfter - data.atsScoreBefore}% improvement
                        </p>
                      )}
                    </div>

                    {(data.keywords ?? []).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Matched Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(data.keywords ?? []).map((kw) => (
                            <Badge key={kw} variant="success" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(data.missingKeywords ?? []).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Missing Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(data.missingKeywords ?? []).map((kw) => (
                            <Badge key={kw} variant="danger" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-[var(--text-3)]">These keywords appear in the job description but were not found in your CV.</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </Modal>
  );
}
