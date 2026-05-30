import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import type { ApiResponse } from "@/types/api";

interface RouteContext {
  params: { id: string };
}

// ── Anthropic helpers (self-contained, no external package import) ─────────────

async function callClaude(prompt: string, maxTokens = 2000): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${txt.slice(0, 200)}`);
  }

  const json = await res.json() as { content: Array<{ type: string; text: string }> };
  const text = json.content?.find((b) => b.type === "text")?.text ?? "";
  if (!text) throw new Error("Empty response from Claude");
  return text;
}

function parseJsonResponse(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Claude returned non-JSON output");
    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

// ── GET /api/jobs/[id]/tailor-cv ──────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await connectDB();
    const JobModel = (await import("@/models/Job")).default;
    const job = await JobModel.findById(params.id).lean();
    if (!job) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });

    const j = job as Record<string, unknown>;
    return NextResponse.json({
      success: true,
      data: {
        status: j.tailoredCvStatus ?? "Not Started",
        headline: j.tailoredCvHeadline ?? null,
        summary: j.tailoredCvSummary ?? null,
        keywords: j.tailoredCvKeywords ?? [],
        missingKeywords: j.tailoredCvMissingKeywords ?? [],
        bullets: j.tailoredCvBullets ?? [],
        atsScoreBefore: j.tailoredCvAtsScoreBefore ?? null,
        atsScoreAfter: j.tailoredCvAtsScoreAfter ?? null,
        generatedAt: j.tailoredCvGeneratedAt ?? null,
        coverLetter: j.tailoredCoverLetter ?? null,
        coverLetterSubject: j.tailoredCoverLetterSubject ?? null,
        error: j.tailoredCvError ?? null,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/jobs/[id]/tailor-cv ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    await connectDB();
    const JobModel = (await import("@/models/Job")).default;
    const DocumentModel = (await import("@/models/Document")).default;

    const job = await JobModel.findById(params.id).lean();
    if (!job) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });

    const j = job as Record<string, unknown>;

    // Find the active CV document with extracted text
    const cvDoc = await DocumentModel.findOne({
      $or: [
        { type: "CV", content: { $exists: true, $ne: "" } },
        { type: "cv_resume", content: { $exists: true, $ne: "" } },
      ],
    })
      .sort({ updatedAt: -1 })
      .lean() as Record<string, unknown> | null;

    const cvText = cvDoc?.content as string | undefined;
    if (!cvText) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No CV with extracted text found. Upload a CV in the Documents module and make sure the content is extracted.",
        },
        { status: 422 }
      );
    }

    // Mark as queued
    await JobModel.findByIdAndUpdate(params.id, { tailoredCvStatus: "Queued", tailoredCvError: null });

    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const userInstructions = typeof body.userInstructions === "string" && body.userInstructions ? body.userInstructions : null;
    const tone = String(body.tone ?? "professional");

    const company = String(j.company ?? "");
    const position = String(j.title ?? j.position ?? "");
    const description = String(j.description ?? "");

    try {
      // Run CV tailoring and cover letter in parallel
      const [cvRaw, clRaw] = await Promise.all([
        callClaude(
          [
            "You are an expert ATS resume optimizer. Tailor the candidate's CV to the target job.",
            "CRITICAL RULES:",
            "- Never invent experience, credentials, or skills not in the original CV.",
            "- Never change dates, company names, job titles, or metrics.",
            "- Rewrite only headline, summary, and reorder/reframe existing bullets.",
            "Output ONLY valid JSON with these keys:",
            '  "tailoredHeadline": string (max 12 words)',
            '  "tailoredSummary": string (3-4 sentences with ATS keywords)',
            '  "atsKeywords": string[] (10-15 matched keywords)',
            '  "missingKeywords": string[] (max 8 important JD keywords absent from CV)',
            '  "atsScoreBefore": number 0-100',
            '  "atsScoreAfter": number 0-100',
            '  "tailoredBullets": [{"role": string, "bullets": string[]}] (top 2-3 roles)',
            "",
            `Company: ${company}`,
            `Position: ${position}`,
            `Job Description:\n${description || "Not provided"}`,
            "",
            `Original CV:\n${cvText}`,
            ...(userInstructions ? [`\nExtra instructions: ${userInstructions}`] : []),
          ].join("\n"),
          2000
        ),
        callClaude(
          [
            "You are a professional cover letter writer. Output ONLY valid JSON.",
            "Return a JSON object with:",
            '  "subject": string (email subject)',
            `  "cover_letter": string (${tone} tone, 250-350 words, plain text with \\n line breaks)`,
            '  "key_customizations": string[] (3-5 tailoring notes)',
            '  "missing_info_warnings": string[] (requirements not addressed)',
            "Base the letter on the candidate's actual CV experience. Do not fabricate.",
            "",
            `Company: ${company}`,
            `Position: ${position}`,
            `Job Description:\n${description || "Not provided"}`,
            "",
            `Candidate CV:\n${cvText}`,
            ...(userInstructions ? [`\nExtra instructions: ${userInstructions}`] : []),
          ].join("\n"),
          1200
        ),
      ]);

      const cvData = parseJsonResponse(cvRaw);
      const clData = parseJsonResponse(clRaw);

      const update = {
        tailoredCvStatus: "Completed",
        tailoredCvHeadline: String(cvData.tailoredHeadline ?? ""),
        tailoredCvSummary: String(cvData.tailoredSummary ?? ""),
        tailoredCvKeywords: Array.isArray(cvData.atsKeywords) ? cvData.atsKeywords as string[] : [],
        tailoredCvMissingKeywords: Array.isArray(cvData.missingKeywords) ? cvData.missingKeywords as string[] : [],
        tailoredCvBullets: Array.isArray(cvData.tailoredBullets) ? cvData.tailoredBullets : [],
        tailoredCvAtsScoreBefore: Number(cvData.atsScoreBefore ?? 0),
        tailoredCvAtsScoreAfter: Number(cvData.atsScoreAfter ?? 0),
        tailoredCvGeneratedAt: new Date(),
        tailoredCoverLetter: String(clData.cover_letter ?? ""),
        tailoredCoverLetterSubject: String(clData.subject ?? ""),
        tailoredCvError: null,
      };

      await JobModel.findByIdAndUpdate(params.id, update);

      return NextResponse.json({
        success: true,
        data: {
          status: "Completed",
          headline: update.tailoredCvHeadline,
          summary: update.tailoredCvSummary,
          keywords: update.tailoredCvKeywords,
          missingKeywords: update.tailoredCvMissingKeywords,
          bullets: update.tailoredCvBullets,
          atsScoreBefore: update.tailoredCvAtsScoreBefore,
          atsScoreAfter: update.tailoredCvAtsScoreAfter,
          generatedAt: update.tailoredCvGeneratedAt.toISOString(),
          coverLetter: update.tailoredCoverLetter,
          coverLetterSubject: update.tailoredCoverLetterSubject,
          error: null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI generation failed";
      await JobModel.findByIdAndUpdate(params.id, { tailoredCvStatus: "Failed", tailoredCvError: message });
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
