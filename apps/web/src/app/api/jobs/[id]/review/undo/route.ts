import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

interface Ctx { params: { id: string } }

export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const JobModel = (await import("@/models/Job")).default;
    await JobModel.findByIdAndUpdate(params.id, {
      $set: { reviewStatus: "new", reviewAction: null, reviewedAt: null },
    });
    return NextResponse.json({ success: true, data: { jobId: params.id, reviewStatus: "new", undone: true } });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
