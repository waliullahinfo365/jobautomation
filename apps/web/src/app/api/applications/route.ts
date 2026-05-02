import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { applicationSchema } from "@/schemas/application.schema";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Application } from "@/types/application";

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<Application>>>> {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    // TODO: const apps = await ApplicationModel.find(jobId ? { jobId } : {}).lean();
    console.log("GET /api/applications", { jobId });
    return NextResponse.json({
      success: true,
      data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0, hasNext: false, hasPrev: false },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Application>>> {
  try {
    await connectDB();
    const body   = await req.json();
    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });
    }
    // TODO: ApplicationModel.create(parsed.data)
    // TODO: LifecycleService.onApplied if status = Applied
    return NextResponse.json({ success: true, message: "Not implemented" }, { status: 501 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
