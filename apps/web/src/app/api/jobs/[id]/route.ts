import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { updateJobSchema } from "@/schemas/job.schema";
import type { ApiResponse } from "@/types/api";
import type { Job } from "@/types/job";

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/jobs/[id]
 */
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<Job>>> {
  try {
    await connectDB();
    // TODO: const job = await JobModel.findById(params.id).lean();
    // TODO: if (!job) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Not implemented" }, { status: 501 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/jobs/[id]
 */
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<Job>>> {
  try {
    await connectDB();
    const body   = await req.json();
    const parsed = updateJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });
    }
    // TODO: const job = await JobModel.findByIdAndUpdate(params.id, parsed.data, { new: true }).lean();
    // TODO: LifecycleService side-effects based on status change
    return NextResponse.json({ success: true, message: "Not implemented" }, { status: 501 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/jobs/[id]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB();
    // TODO: JobModel.findByIdAndDelete(params.id)
    return NextResponse.json({ success: true, message: "Not implemented" }, { status: 501 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
