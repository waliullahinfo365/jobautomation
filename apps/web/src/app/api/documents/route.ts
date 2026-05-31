import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import type { ApiResponse } from "@/types/api";

export async function GET(_req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await connectDB();
    const DocumentModel = (await import("@/models/Document")).default;
    const docs = await DocumentModel.find({}).sort({ updatedAt: -1 }).lean();

    const items = docs.map((d) => {
      const doc = d as Record<string, unknown>;
      return {
        id:           String(doc._id),
        _id:          String(doc._id),
        fileName:     String(doc.name ?? ""),
        type:         mapDocType(String(doc.type ?? "")),
        relatedJob:   "—",
        company:      "",
        position:     "",
        status:       String(doc.status ?? "Draft"),
        storageLocation: String(doc.driveUrl ?? ""),
        storageUrl:   String(doc.driveUrl ?? ""),
        lastUpdated:  String(doc.updatedAt ?? doc.createdAt ?? new Date().toISOString()),
        contentText:  String(doc.content ?? ""),
        jobId:        doc.jobId ? String(doc.jobId) : undefined,
        profileDocumentType: doc.type === "CV" ? "cv_resume" : undefined,
        isActiveProfileDocument: false,
      };
    });

    return NextResponse.json({ success: true, data: { items, total: items.length, page: 1, pageSize: 100, totalPages: 1, hasNext: false, hasPrev: false } });
  } catch (err) {
    console.error("[GET /api/documents]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await connectDB();
    const DocumentModel = (await import("@/models/Document")).default;

    const body = await req.json() as Record<string, unknown>;

    // Accept both field naming conventions from the frontend
    const name    = String(body.fileName ?? body.name ?? "Untitled");
    const rawType = String(body.type ?? body.documentKind ?? "Other");
    const type    = toModelDocType(rawType);
    const content = String(body.contentText ?? body.content ?? "");
    const jobId   = body.jobId ? String(body.jobId) : undefined;

    const doc = await DocumentModel.create({
      name,
      type,
      status:        "Draft",
      content:       content || undefined,
      jobId:         jobId ?? undefined,
      generatedByAI: false,
      version:       1,
    });

    const d = doc as unknown as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      data: {
        id:           String(d._id),
        _id:          String(d._id),
        fileName:     String(d.name),
        type:         mapDocType(String(d.type)),
        relatedJob:   "—",
        company:      "",
        position:     "",
        status:       String(d.status),
        storageLocation: "",
        lastUpdated:  String(d.updatedAt ?? new Date().toISOString()),
        contentText:  String(d.content ?? ""),
        jobId:        d.jobId ? String(d.jobId) : undefined,
        profileDocumentType: d.type === "CV" ? "cv_resume" : undefined,
        isActiveProfileDocument: false,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/documents]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

function toModelDocType(raw: string): string {
  const map: Record<string, string> = {
    cv_resume: "CV",
    CV: "CV",
    "Cover Letter": "Cover Letter",
    cover_letter_template: "Cover Letter",
    "Cover Letter Template": "Cover Letter",
    Research: "Research",
    "Research Document": "Research",
    supporting_document: "Other",
    "Supporting Document": "Other",
    Portfolio: "Other",
    "Email Template": "Other",
    "AI Draft": "Other",
    "PDF Export": "Other",
  };
  return map[raw] ?? "Other";
}

function mapDocType(raw: string): string {
  if (raw === "CV") return "CV";
  if (raw === "Cover Letter") return "Cover Letter";
  if (raw === "Research") return "Research Document";
  return raw;
}
