import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import type { CvTemplateId } from "@/lib/cv-templates";

interface RouteContext {
  params: { id: string };
}

/**
 * POST /api/jobs/[id]/cv-pdf
 * Body: { templateId: CvTemplateId; data: CvTemplateData }
 * Returns a PDF file stream.
 */
export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    await connectDB();
    const JobModel = (await import("@/models/Job")).default;

    const job = await JobModel.findById(params.id).lean();
    if (!job) {
      return new NextResponse("Job not found", { status: 404 });
    }

    const body = await req.json() as {
      templateId?: CvTemplateId;
      data?: Record<string, unknown>;
    };

    const templateId: CvTemplateId = body.templateId ?? "modern-no-photo";

    const j = job as Record<string, unknown>;

    // Build template data from job's tailored CV + provided data override
    const { renderCvToPdf } = await import("@/lib/cv-templates");
    const templateData = {
      fullName:   String(body.data?.fullName ?? ""),
      headline:   String(body.data?.headline ?? j.tailoredCvHeadline ?? ""),
      summary:    String(body.data?.summary  ?? j.tailoredCvSummary  ?? ""),
      email:      String(body.data?.email    ?? ""),
      phone:      String(body.data?.phone    ?? ""),
      location:   String(body.data?.location ?? ""),
      linkedIn:   String(body.data?.linkedIn ?? ""),
      photoUrl:   body.data?.photoUrl ? String(body.data.photoUrl) : undefined,
      skills:     Array.isArray(body.data?.skills)        ? body.data!.skills as string[]        : (j.tailoredCvKeywords as string[] | undefined) ?? [],
      experience: Array.isArray(body.data?.experience)    ? body.data!.experience as never[]    : (j.tailoredCvBullets  as never[] | undefined) ?? [],
      education:  Array.isArray(body.data?.education)     ? body.data!.education as never[]     : [],
      languages:  Array.isArray(body.data?.languages)     ? body.data!.languages as never[]     : [],
      certifications: Array.isArray(body.data?.certifications) ? body.data!.certifications as string[] : [],
    };

    const pdfBuffer = await renderCvToPdf(templateId, templateData);

    const filename = `cv-${String(j.company ?? "").replace(/\s+/g, "-")}-${String(j.title ?? j.position ?? "").replace(/\s+/g, "-")}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    return new NextResponse(message, { status: 500 });
  }
}
