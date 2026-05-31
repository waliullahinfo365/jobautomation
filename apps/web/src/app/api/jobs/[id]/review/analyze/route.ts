import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

interface Ctx { params: { id: string } }

async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: 800, temperature: 0.3, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const json = await res.json() as { content: Array<{ type: string; text: string }> };
  return json.content?.find((b) => b.type === "text")?.text ?? "";
}

/**
 * POST /api/jobs/[id]/review/analyze
 * Generates AI review analysis for a job card and caches it on the job document.
 */
export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    await connectDB();
    const JobModel = (await import("@/models/Job")).default;
    const job = await JobModel.findById(params.id).lean();
    if (!job) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const j = job as Record<string, unknown>;

    // Return cached result if available
    if (j.reviewAiScore != null) {
      return NextResponse.json({
        success: true,
        data: {
          score:          Number(j.reviewAiScore),
          reasons:        (j.reviewAiReasons as string[]) ?? [],
          redFlags:       (j.reviewAiRedFlags as string[]) ?? [],
          effort:         String(j.reviewAiEffort ?? "Medium"),
          recommendation: String(j.reviewAiRecommendation ?? ""),
        },
      });
    }

    const raw = await callClaude([
      "You are a job-fit analyst. Analyse this job posting and output ONLY valid JSON:",
      '{"score": number 0-100, "reasons": string[] (3-5 why it fits), "redFlags": string[] (0-3 concerns), "effort": "Low"|"Medium"|"High", "recommendation": string (1 sentence)}',
      "",
      `Position: ${String(j.title ?? "")}`,
      `Company: ${String(j.company ?? "")}`,
      `Description: ${String(j.description ?? j.aiSummary ?? "Not provided")}`,
    ].join("\n"));

    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(cleaned) as Record<string, unknown>; }
    catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) as Record<string, unknown> : {};
    }

    const result = {
      score:          Number(parsed.score ?? 50),
      reasons:        Array.isArray(parsed.reasons)  ? parsed.reasons  as string[] : [],
      redFlags:       Array.isArray(parsed.redFlags)  ? parsed.redFlags as string[] : [],
      effort:         String(parsed.effort ?? "Medium") as "Low" | "Medium" | "High",
      recommendation: String(parsed.recommendation ?? ""),
    };

    await JobModel.findByIdAndUpdate(params.id, {
      $set: {
        reviewAiScore:          result.score,
        reviewAiReasons:        result.reasons,
        reviewAiRedFlags:       result.redFlags,
        reviewAiEffort:         result.effort,
        reviewAiRecommendation: result.recommendation,
        reviewAiGeneratedAt:    new Date(),
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("[POST /api/jobs/[id]/review/analyze]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
