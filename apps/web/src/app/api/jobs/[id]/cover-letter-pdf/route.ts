import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export const maxDuration = 60; // Vercel: allow up to 60s for PDF generation

interface RouteContext {
  params: { id: string };
}

/**
 * POST /api/jobs/[id]/cover-letter-pdf
 * Body: { style?: "modern"|"classic"; fullName: string; email?; phone?; location?; hiringManagerName? }
 * Returns a styled cover letter PDF.
 */
export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    await connectDB();
    const JobModel = (await import("@/models/Job")).default;

    const job = await JobModel.findById(params.id).lean();
    if (!job) return new NextResponse("Job not found", { status: 404 });

    const j = job as Record<string, unknown>;
    const body = await req.json() as Record<string, unknown>;

    const coverLetterBody = String(j.tailoredCoverLetter ?? "");
    if (!coverLetterBody) {
      return new NextResponse("No cover letter generated yet. Run CV tailoring first.", { status: 422 });
    }

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const React = (await import("react")).default;
    const { CoverLetterPdf } = await import("@/lib/cv-templates/cover-letter");

    const data = {
      fullName:           String(body.fullName ?? "Your Name"),
      email:              body.email    ? String(body.email)    : undefined,
      phone:              body.phone    ? String(body.phone)    : undefined,
      location:           body.location ? String(body.location) : undefined,
      linkedIn:           body.linkedIn ? String(body.linkedIn) : undefined,
      hiringManagerName:  body.hiringManagerName ? String(body.hiringManagerName) : undefined,
      company:            String(j.company ?? ""),
      position:           String((j.title ?? j.position) ?? ""),
      subject:            String(j.tailoredCoverLetterSubject ?? ""),
      body:               coverLetterBody,
      style:              (body.style as "modern" | "classic") ?? "modern",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(CoverLetterPdf, { data }) as any;
    const buffer = await renderToBuffer(element);

    const filename = `cover-letter-${data.company.replace(/\s+/g, "-")}.pdf`;

    return new NextResponse(Buffer.from(buffer) as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "PDF generation failed";
    return new NextResponse(msg, { status: 500 });
  }
}
