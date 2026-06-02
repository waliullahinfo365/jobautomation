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

function CvPdfClientDownload({ templateId, data, filename, jobId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/cv-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, data }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(text || `Server error ${res.status}`);
      }

      const blob = await res.blob();
      if (blob.size === 0) throw new Error("Server returned empty PDF");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button onClick={() => void handleClick()} disabled={loading} className="w-full">
        {loading ? "Generating PDF…" : "⬇ Download PDF"}
      </Button>
      {error && <p className="text-xs text-red-400 text-center truncate">{error}</p>}
    </div>
  );
}

export default CvPdfClientDownload;
