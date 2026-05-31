import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

/**
 * GET /api/jobs/review/queue
 * Returns jobs that are pending review (reviewStatus = "new" or not set).
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const JobModel = (await import("@/models/Job")).default;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "30", 10));

    const jobs = await JobModel.find({
      $or: [
        { reviewStatus: { $exists: false } },
        { reviewStatus: null },
        { reviewStatus: "new" },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const total = await JobModel.countDocuments({
      $or: [{ reviewStatus: { $exists: false } }, { reviewStatus: null }, { reviewStatus: "new" }],
    });

    const items = (jobs as Record<string, unknown>[]).map((j) => ({
      id:             String(j._id),
      _id:            String(j._id),
      position:       String(j.title ?? ""),
      company:        String(j.company ?? ""),
      location:       String(j.location ?? ""),
      remote:         Boolean(j.remote),
      source:         String(j.source ?? "Manual"),
      salaryRange:    j.salaryRange ? String(j.salaryRange) : undefined,
      description:    j.description ? String(j.description) : undefined,
      aiSummary:      j.aiSummary   ? String(j.aiSummary)   : undefined,
      jobUrl:         String(j.url ?? ""),
      contactEmail:   j.contactEmail ? String(j.contactEmail) : undefined,
      reviewStatus:   String(j.reviewStatus ?? "new"),
      reviewAiScore:          j.reviewAiScore,
      reviewAiReasons:        j.reviewAiReasons ?? [],
      reviewAiRedFlags:       j.reviewAiRedFlags ?? [],
      reviewAiEffort:         j.reviewAiEffort,
      reviewAiRecommendation: j.reviewAiRecommendation,
    }));

    return NextResponse.json({ success: true, data: { items, total } });
  } catch (err) {
    console.error("[GET /api/jobs/review/queue]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
