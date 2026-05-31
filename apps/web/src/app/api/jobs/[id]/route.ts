import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import type { ApiResponse } from "@/types/api";

interface Ctx { params: { id: string } }

function normalizeJob(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    id:           String(raw._id),
    _id:          String(raw._id),
    title:        String(raw.title ?? ""),
    position:     String(raw.title ?? ""),
    company:      String(raw.company ?? ""),
    location:     String(raw.location ?? ""),
    remote:       Boolean(raw.remote),
    jobUrl:       String(raw.url ?? ""),
    description:  raw.description  ? String(raw.description)  : undefined,
    aiSummary:    raw.aiSummary     ? String(raw.aiSummary)    : undefined,
    status:       String(raw.status  ?? "New"),
    reviewStatus: raw.reviewStatus  ? String(raw.reviewStatus) : "new",
    source:       String(raw.source  ?? "Manual"),
    tags:         Array.isArray(raw.tags) ? raw.tags : [],
    notes:        raw.notes ? String(raw.notes) : undefined,
    contactEmail: raw.contactEmail ? String(raw.contactEmail) : undefined,
    salaryRange:  raw.salaryRange   ? String(raw.salaryRange)  : undefined,
    createdAt:    raw.createdAt,
    updatedAt:    raw.updatedAt,
    reviewAiScore:          raw.reviewAiScore,
    reviewAiReasons:        raw.reviewAiReasons,
    reviewAiRedFlags:       raw.reviewAiRedFlags,
    reviewAiEffort:         raw.reviewAiEffort,
    reviewAiRecommendation: raw.reviewAiRecommendation,
    tailoredCvStatus:       raw.tailoredCvStatus,
    tailoredCvHeadline:     raw.tailoredCvHeadline,
    tailoredCvSummary:      raw.tailoredCvSummary,
  };
}

export async function GET(_req: NextRequest, { params }: Ctx): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await connectDB();
    const JobModel = (await import("@/models/Job")).default;
    const job = await JobModel.findById(params.id).lean();
    if (!job) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: normalizeJob(job as Record<string, unknown>) });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await connectDB();
    const JobModel = (await import("@/models/Job")).default;
    const body = await req.json() as Record<string, unknown>;
    const job = await JobModel.findByIdAndUpdate(params.id, { $set: body }, { new: true }).lean();
    if (!job) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: normalizeJob(job as Record<string, unknown>) });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await connectDB();
    const JobModel = (await import("@/models/Job")).default;
    await JobModel.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
