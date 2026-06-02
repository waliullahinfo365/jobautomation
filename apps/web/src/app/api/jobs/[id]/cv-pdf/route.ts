import { NextRequest, NextResponse } from "next/server";
import type { CvTemplateId } from "@/lib/cv-templates";

export const maxDuration = 60;

interface RouteContext {
  params: { id: string };
}

/**
 * POST /api/jobs/[id]/cv-pdf
 * Body: { templateId: CvTemplateId; data: CvTemplateData }
 * Returns a PDF binary. All data is taken from the request body —
 * no DB connection required.
 */
export async function POST(
  req: NextRequest,
  { params: _params }: RouteContext
): Promise<NextResponse> {
  try {
    const body = await req.json() as {
      templateId?: CvTemplateId;
      data?: Record<string, unknown>;
    };

    const templateId: CvTemplateId = body.templateId ?? "modern-no-photo";
    const d = body.data ?? {};

    const { renderCvToPdf } = await import("@/lib/cv-templates");
    const templateData = {
      fullName:   String(d.fullName   ?? ""),
      headline:   String(d.headline   ?? ""),
      summary:    String(d.summary    ?? ""),
      email:      d.email    ? String(d.email)    : undefined,
      phone:      d.phone    ? String(d.phone)    : undefined,
      location:   d.location ? String(d.location) : undefined,
      linkedIn:   d.linkedIn ? String(d.linkedIn) : undefined,
      photoUrl:   d.photoUrl ? String(d.photoUrl) : undefined,
      skills:     Array.isArray(d.skills)      ? (d.skills as string[])      : [],
      experience: Array.isArray(d.experience)  ? (d.experience as never[])
                : Array.isArray(d.bullets)     ? (d.bullets    as never[])  : [],
      education:  Array.isArray(d.education)   ? (d.education  as never[])  : [],
      languages:  Array.isArray(d.languages)   ? (d.languages  as never[])  : [],
      certifications: Array.isArray(d.certifications) ? (d.certifications as string[]) : [],
    };

    const pdfBuffer = await renderCvToPdf(templateId, templateData);

    const filename = `cv-tailored.pdf`;

    // Wrap in Blob — passing a Node.js Buffer directly as BodyInit corrupts
    // binary content in Next.js App Router (web Response under the hood).
    const blob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(blob.size),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    return new NextResponse(message, { status: 500 });
  }
}
