"use client";

import { usePDF } from "@react-pdf/renderer";
import React, { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { CvTemplateData, CvTemplateId } from "@/lib/cv-templates/types";

interface Props {
  templateId: CvTemplateId;
  data: CvTemplateData;
  filename: string;
}

/** Normalize raw API data into the exact shape the PDF templates require */
function normalizeTemplateData(raw: CvTemplateData): CvTemplateData {
  return {
    fullName:  String(raw.fullName  ?? ""),
    headline:  String(raw.headline  ?? ""),
    summary:   String(raw.summary   ?? ""),
    email:     raw.email    ? String(raw.email)    : undefined,
    phone:     raw.phone    ? String(raw.phone)    : undefined,
    location:  raw.location ? String(raw.location) : undefined,
    linkedIn:  raw.linkedIn ? String(raw.linkedIn) : undefined,
    photoUrl:  raw.photoUrl ? String(raw.photoUrl) : undefined,
    skills: Array.isArray(raw.skills)
      ? (raw.skills as unknown[]).map((s) => String(s)).filter(Boolean)
      : [],
    experience: Array.isArray(raw.experience)
      ? (raw.experience as unknown[]).map((e) => {
          const exp = (typeof e === "object" && e !== null ? e : {}) as Record<string, unknown>;
          return {
            role:    String(exp.role    ?? exp.title    ?? ""),
            company: String(exp.company ?? exp.employer ?? ""),
            period:  exp.period ? String(exp.period) : undefined,
            bullets: Array.isArray(exp.bullets)
              ? (exp.bullets as unknown[]).map((b) => String(b)).filter(Boolean)
              : Array.isArray(exp.achievements)
                ? (exp.achievements as unknown[]).map((b) => String(b)).filter(Boolean)
                : [],
          };
        }).filter((e) => e.role || e.bullets.length > 0)
      : [],
    education: Array.isArray(raw.education)
      ? (raw.education as unknown[]).map((e) => {
          const ed = (typeof e === "object" && e !== null ? e : {}) as Record<string, unknown>;
          return {
            degree:      String(ed.degree      ?? ed.title   ?? ""),
            institution: String(ed.institution ?? ed.school  ?? ""),
            year:        ed.year ? String(ed.year) : undefined,
          };
        }).filter((e) => e.degree || e.institution)
      : [],
    languages:      Array.isArray(raw.languages)      ? raw.languages      : [],
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
  };
}

function PdfDownloadInner({ templateId, data, filename }: Props) {
  const [TemplateComponent, setTemplate] = React.useState<React.ComponentType<{ data: CvTemplateData }> | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    const load = async () => {
      try {
        let Comp: React.ComponentType<{ data: CvTemplateData }>;
        switch (templateId) {
          case "modern-with-photo": {
            const m = await import("@/lib/cv-templates/modern-with-photo");
            Comp = m.ModernWithPhotoCv;
            break;
          }
          case "classic-no-photo": {
            const m = await import("@/lib/cv-templates/classic-no-photo");
            Comp = m.ClassicNoPhotoCv;
            break;
          }
          case "classic-with-photo": {
            const m = await import("@/lib/cv-templates/classic-with-photo");
            Comp = m.ClassicWithPhotoCv;
            break;
          }
          default: {
            const m = await import("@/lib/cv-templates/modern-no-photo");
            Comp = m.ModernNoPhotoCv;
          }
        }
        setTemplate(() => Comp);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Template load failed");
      }
    };
    void load();
  }, [templateId]);

  const normalizedData = useMemo(() => normalizeTemplateData(data), [data]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = TemplateComponent ? React.createElement(TemplateComponent as any, { data: normalizedData }) : undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [instance] = usePDF({ document: doc as any });

  if (loadError) {
    return <Button disabled className="w-full opacity-60">Template error: {loadError}</Button>;
  }

  if (!TemplateComponent || instance.loading) {
    return <Button disabled className="w-full opacity-60">Preparing PDF…</Button>;
  }

  if (instance.error) {
    return <Button disabled className="w-full opacity-60">Render error — check console</Button>;
  }

  return (
    <a href={instance.url ?? "#"} download={filename} className="block w-full">
      <Button className="w-full">⬇ Download PDF</Button>
    </a>
  );
}

export default PdfDownloadInner;
