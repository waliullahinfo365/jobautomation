"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CvTemplateData, CvTemplateId } from "@/lib/cv-templates/types";

interface Props {
  templateId: CvTemplateId;
  data: CvTemplateData;
  filename: string;
}

/** Normalize raw API data so templates never receive undefined in required fields */
function normalizeData(raw: CvTemplateData): CvTemplateData {
  return {
    fullName: String(raw.fullName ?? ""),
    headline: String(raw.headline ?? ""),
    summary:  String(raw.summary  ?? ""),
    email:    raw.email    ? String(raw.email)    : undefined,
    phone:    raw.phone    ? String(raw.phone)    : undefined,
    location: raw.location ? String(raw.location) : undefined,
    linkedIn: raw.linkedIn ? String(raw.linkedIn) : undefined,
    photoUrl: raw.photoUrl ? String(raw.photoUrl) : undefined,
    skills: Array.isArray(raw.skills)
      ? (raw.skills as unknown[]).map(String).filter(Boolean)
      : [],
    experience: Array.isArray(raw.experience)
      ? (raw.experience as unknown[]).map((e) => {
          const x = (typeof e === "object" && e !== null ? e : {}) as Record<string, unknown>;
          return {
            role:    String(x.role    ?? x.title    ?? ""),
            company: String(x.company ?? x.employer ?? ""),
            period:  x.period ? String(x.period) : undefined,
            bullets: Array.isArray(x.bullets)
              ? (x.bullets as unknown[]).map(String).filter(Boolean)
              : Array.isArray(x.achievements)
                ? (x.achievements as unknown[]).map(String).filter(Boolean)
                : [],
          };
        }).filter((e) => e.role || e.bullets.length > 0)
      : [],
    education: [],
    languages: [],
    certifications: [],
  };
}

async function generatePdfBlob(
  templateId: CvTemplateId,
  data: CvTemplateData
): Promise<Blob> {
  // Import pdf() function and the template dynamically (browser only)
  const { pdf } = await import("@react-pdf/renderer");

  let element: React.ReactElement;
  switch (templateId) {
    case "modern-with-photo": {
      const { ModernWithPhotoCv } = await import("@/lib/cv-templates/modern-with-photo");
      element = React.createElement(ModernWithPhotoCv, { data });
      break;
    }
    case "classic-no-photo": {
      const { ClassicNoPhotoCv } = await import("@/lib/cv-templates/classic-no-photo");
      element = React.createElement(ClassicNoPhotoCv, { data });
      break;
    }
    case "classic-with-photo": {
      const { ClassicWithPhotoCv } = await import("@/lib/cv-templates/classic-with-photo");
      element = React.createElement(ClassicWithPhotoCv, { data });
      break;
    }
    default: {
      const { ModernNoPhotoCv } = await import("@/lib/cv-templates/modern-no-photo");
      element = React.createElement(ModernNoPhotoCv, { data });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (pdf as any)(element).toBlob();
}

function CvPdfClientDownload({ templateId, data, filename }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const normalized = normalizeData(data);
      const blob = await generatePdfBlob(templateId, normalized);
      if (!blob || blob.size === 0) throw new Error("Generated PDF is empty");

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

  if (error) {
    return (
      <div className="space-y-1">
        <Button onClick={() => void handleClick()} className="w-full" disabled={loading}>
          Retry Download
        </Button>
        <p className="text-xs text-red-400 text-center">{error}</p>
      </div>
    );
  }

  return (
    <Button onClick={() => void handleClick()} disabled={loading} className="w-full">
      {loading ? "Generating PDF…" : "⬇ Download PDF"}
    </Button>
  );
}

export default CvPdfClientDownload;
