import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

interface Ctx { params: { id: string } }

/**
 * PATCH /api/jobs/[id]/review
 * Body: { reviewAction, reviewStatus }
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const JobModel = (await import("@/models/Job")).default;

    const body = await req.json() as Record<string, unknown>;
    const reviewStatus = String(body.reviewStatus ?? "new");
    const reviewAction = String(body.reviewAction ?? "");

    await JobModel.findByIdAndUpdate(params.id, {
      $set: { reviewStatus, reviewAction, reviewedAt: new Date() },
    });

    return NextResponse.json({ success: true, data: { jobId: params.id, reviewStatus, reviewAction } });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
