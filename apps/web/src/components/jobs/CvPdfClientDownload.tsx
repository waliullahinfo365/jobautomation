"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CvTemplateData, CvTemplateId } from "@/lib/cv-templates/types";

interface Props {
  templateId: CvTemplateId;
  data: CvTemplateData;
  filename: string;
  jobId: string;
}

async function downloadFromRoute(path: string, data: unknown, filename: string) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `Server error ${res.status}`);
  }
  const blob = await res.blob();
  if (blob.size === 0) throw new Error("Server returned empty file");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function CvPdfClientDownload({ templateId, data, filename, jobId }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePdf = async () => {
    setPdfLoading(true);
    setError(null);
    try {
      await downloadFromRoute(
        `/api/jobs/${jobId}/cv-pdf`,
        { ...data, templateId },
        filename,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF generation failed");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDocx = async () => {
    setDocxLoading(true);
    setError(null);
    try {
      await downloadFromRoute(
        `/api/jobs/${jobId}/cv-docx`,
        data,
        filename.replace(".pdf", ".docx"),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Word doc generation failed");
    } finally {
      setDocxLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          onClick={() => void handlePdf()}
          disabled={pdfLoading || docxLoading}
          className="flex-1"
        >
          {pdfLoading ? "Generating…" : "⬇ Download PDF"}
        </Button>
        <Button
          variant="outline"
          onClick={() => void handleDocx()}
          disabled={pdfLoading || docxLoading}
          className="flex-1"
        >
          {docxLoading ? "Generating…" : "⬇ Word (.docx)"}
        </Button>
      </div>
      {error && <p className="text-xs text-red-400 text-center truncate">{error}</p>}
    </div>
  );
}

export default CvPdfClientDownload;
