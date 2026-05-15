import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { jobSchema } from "@/schemas/job.schema";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Job } from "@/types/job";

/**
 * GET /api/jobs
 * Returns a paginated, filterable list of jobs.
 */
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<Job>>>> {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page     = parseInt(searchParams.get("page")     ?? "1",  10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10);
    const status   = searchParams.get("status");
    const search   = searchParams.get("search");

    // TODO: Build Mongoose query with status filter, text search, pagination
    // TODO: const jobs = await JobModel.find(query).skip(...).limit(pageSize).lean();
    // TODO: const total = await JobModel.countDocuments(query);


    return NextResponse.json({
      success: true,
      data: { items: [], total: 0, page, pageSize, totalPages: 0, hasNext: false, hasPrev: false },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/jobs
 * Creates a new job and triggers the intake pipeline.
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Job>>> {
  try {
    await connectDB();
    const body   = await req.json();
    const parsed = jobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });
    }

    // TODO: DuplicateProtectionService.check
    // TODO: JobModel.create(parsed.data)
    // TODO: DriveService.createFolder (async)
    // TODO: Return created job

    return NextResponse.json({ success: true, message: "Job creation not yet implemented" }, { status: 501 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
