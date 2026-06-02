import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

interface RouteContext { params: { id: string } }

export async function POST(req: NextRequest, { params: _params }: RouteContext): Promise<NextResponse> {
  try {
    const body = await req.json() as Record<string, unknown>;
    const d = (body.data ?? {}) as Record<string, unknown>;

    const fullName  = String(d.fullName  ?? "");
    const headline  = String(d.headline  ?? "");
    const summary   = String(d.summary   ?? "");
    const email     = String(d.email     ?? "");
    const phone     = String(d.phone     ?? "");
    const location  = String(d.location  ?? "");
    const linkedIn  = String(d.linkedIn  ?? "");
    const skills    = Array.isArray(d.skills) ? (d.skills as string[]) : [];
    const experience = Array.isArray(d.experience)
      ? (d.experience as Array<{ role?: string; company?: string; period?: string; bullets?: string[] }>)
      : [];

    const {
      Document, Packer, Paragraph, TextRun, HeadingLevel,
      AlignmentType, BorderStyle, convertInchesToTwip,
    } = await import("docx");

    const BLUE  = "1a56db";
    const DARK  = "111827";
    const GRAY  = "6b7280";

    const hr = () => new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 6 } },
      spacing: { before: 160, after: 80 },
      children: [],
    });

    const sectionHeading = (text: string) => new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 80 },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, color: BLUE, size: 22 })],
    });

    const bullet = (text: string) => new Paragraph({
      bullet: { level: 0 },
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text, color: DARK, size: 20 })],
    });

    const children: InstanceType<typeof Paragraph>[] = [];

    // Header
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: fullName || "Your Name", bold: true, size: 52, color: DARK })],
      }),
    );
    if (headline) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: headline, size: 22, color: BLUE })],
      }));
    }
    const contacts = [email, phone, location, linkedIn].filter(Boolean).join("  |  ");
    if (contacts) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: contacts, size: 18, color: GRAY })],
      }));
    }

    // Summary
    if (summary) {
      children.push(hr(), sectionHeading("Professional Summary"));
      children.push(new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: summary, size: 20, color: DARK })],
      }));
    }

    // Experience
    if (experience.length > 0) {
      children.push(hr(), sectionHeading("Professional Experience"));
      for (const exp of experience) {
        children.push(new Paragraph({
          spacing: { before: 160, after: 40 },
          children: [
            new TextRun({ text: exp.role ?? "", bold: true, size: 22, color: DARK }),
            ...(exp.company ? [new TextRun({ text: `  ·  ${exp.company}`, size: 22, color: GRAY })] : []),
            ...(exp.period  ? [new TextRun({ text: `  |  ${exp.period}`,  size: 20, color: GRAY, italics: true })] : []),
          ],
        }));
        for (const b of exp.bullets ?? []) {
          children.push(bullet(b));
        }
      }
    }

    // Skills
    if (skills.length > 0) {
      children.push(hr(), sectionHeading("Key Skills"));
      children.push(new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: skills.join("  ·  "), size: 20, color: DARK })],
      }));
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top:    convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left:   convertInchesToTwip(1),
              right:  convertInchesToTwip(1),
            },
          },
        },
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="cv-tailored.docx"`,
        "Content-Length": String(blob.size),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "DOCX generation failed";
    return new NextResponse(msg, { status: 500 });
  }
}
