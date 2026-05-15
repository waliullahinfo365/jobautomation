import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import type { ApiResponse } from "@/types/api";

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    // TODO: if type === "dashboard-stats" → aggregate stats from Job + Application collections
    // TODO: if type === "daily" → ReportModel.find({ type: "daily" }).sort({ date: -1 }).limit(...)
    // TODO: if type === "weekly" → ReportModel.find({ type: "weekly" }).sort({ date: -1 }).limit(...)

    return NextResponse.json({ success: true, data: null, message: "Not implemented" }, { status: 501 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
