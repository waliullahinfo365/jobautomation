import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<unknown>>>> {
  try {
    await connectDB();
    const JobModel = (await import("@/models/Job")).default;

    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10));
    const pageSize = Math.min(200, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10));
    const status   = searchParams.get("status");
    const search   = searchParams.get("search");
    const reviewStatus = searchParams.get("reviewStatus");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (status)       query.status       = status;
    if (reviewStatus) query.reviewStatus = reviewStatus;
    if (search)       query.$or = [
      { title:   { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
    ];

    const [raw, total] = await Promise.all([
      JobModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      JobModel.countDocuments(query),
    ]);

    const items = (raw as Record<string, unknown>[]).map(normalizeJob);
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: { items, total, page, pageSize, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (err) {
    console.error("[GET /api/jobs]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await connectDB();
    const JobModel = (await import("@/models/Job")).default;

    const body = await req.json() as Record<string, unknown>;
    const title   = String(body.title ?? body.position ?? "").trim();
    const company = String(body.company ?? "").trim();
    if (!title || !company) {
      return NextResponse.json({ success: false, error: "title and company are required" }, { status: 400 });
    }

    const job = await JobModel.create({
      title,
      company,
      location:    String(body.location ?? ""),
      remote:      Boolean(body.remote ?? false),
      url:         String(body.url ?? body.jobUrl ?? ""),
      description: body.description ? String(body.description) : undefined,
      status:      String(body.status ?? "New"),
      source:      String(body.source ?? "Manual"),
      tags:        Array.isArray(body.tags) ? body.tags as string[] : [],
      notes:       body.notes ? String(body.notes) : undefined,
    });

    return NextResponse.json({ success: true, data: normalizeJob(job as unknown as Record<string, unknown>) }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/jobs]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

function normalizeJob(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    id:           String(raw._id),
    _id:          String(raw._id),
    title:        String(raw.title ?? ""),
    position:     String(raw.title ?? ""),
    company:      String(raw.company ?? ""),
    location:     String(raw.location ?? ""),
    remote:       Boolean(raw.remote ?? false),
    jobUrl:       String(raw.url ?? ""),
    url:          String(raw.url ?? ""),
    description:  raw.description  ? String(raw.description)  : undefined,
    aiSummary:    raw.aiSummary     ? String(raw.aiSummary)    : undefined,
    status:       String(raw.status  ?? "New"),
    reviewStatus: raw.reviewStatus  ? String(raw.reviewStatus) : "new",
    source:       String(raw.source  ?? "Manual"),
    tags:         Array.isArray(raw.tags) ? raw.tags : [],
    notes:        raw.notes ? String(raw.notes) : undefined,
    salaryRange:  raw.salary ? formatSalary(raw.salary as Record<string, unknown>) : undefined,
    contactEmail: raw.contactEmail ? String(raw.contactEmail) : undefined,
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

function formatSalary(s: Record<string, unknown>): string | undefined {
  if (!s.min && !s.max) return undefined;
  const cur = String(s.currency ?? "EUR");
  if (s.min && s.max) return `${cur} ${s.min}–${s.max}`;
  if (s.min) return `${cur} ${s.min}+`;
  return `up to ${cur} ${s.max}`;
}
