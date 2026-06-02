import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

interface RouteContext {
  params: { id: string };
}

/**
 * POST /api/jobs/[id]/cover-letter-pdf
 * Body: { style?; fullName; email?; phone?; location?; company; position; subject; body; hiringManagerName? }
 * All data provided in body — no DB connection required.
 */
export async function POST(
  req: NextRequest,
  { params: _params }: RouteContext
): Promise<NextResponse> {
  try {
    const body = await req.json() as Record<string, unknown>;

    const coverLetterBody = String(body.body ?? body.coverLetter ?? "");
    if (!coverLetterBody) {
      return new NextResponse("No cover letter text provided.", { status: 422 });
    }

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const React = (await import("react")).default;
    const { CoverLetterPdf } = await import("@/lib/cv-templates/cover-letter");

    const data = {
      fullName:          String(body.fullName          ?? "Your Name"),
      email:             body.email             ? String(body.email)    : undefined,
      phone:             body.phone             ? String(body.phone)    : undefined,
      location:          body.location          ? String(body.location) : undefined,
      linkedIn:          body.linkedIn          ? String(body.linkedIn) : undefined,
      hiringManagerName: body.hiringManagerName ? String(body.hiringManagerName) : undefined,
      company:           String(body.company    ?? ""),
      position:          String(body.position   ?? ""),
      subject:           String(body.subject    ?? ""),
      body:              coverLetterBody,
      style:             (body.style as "modern" | "classic") ?? "modern",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(CoverLetterPdf, { data }) as any;
    const buffer = await renderToBuffer(element);
    const blob = new Blob([new Uint8Array(buffer as Buffer)], { type: "application/pdf" });

    const filename = `cover-letter-${data.company.replace(/\s+/g, "-") || "download"}.pdf`;

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(blob.size),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "PDF generation failed";
    return new NextResponse(msg, { status: 500 });
  }
}
