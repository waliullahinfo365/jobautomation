import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

export interface AtsBaseScoreResult {
  overallScore: number;
  categoryScores: {
    formatting: number;
    keywords: number;
    structure: number;
    readability: number;
    impact: number;
  };
  strengths: string[];
  criticalIssues: string[];
  improvements: string[];
  improvedHeadline: string;
  improvedSummary: string;
  promptVersion: string;
}

async function callClaude(prompt: string): Promise<string> {
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
      max_tokens: 2000,
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

function parseJson(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try { return JSON.parse(cleaned) as Record<string, unknown>; }
  catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Non-JSON response from Claude");
    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

/**
 * POST /api/documents/ats-score
 * Body: { cvText: string }
 * Scores the CV against ATS rules and returns improvements.
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<AtsBaseScoreResult>>> {
  try {
    const body = await req.json() as { cvText?: string };
    const cvText = body.cvText?.trim();
    if (!cvText) {
      return NextResponse.json({ success: false, error: "cvText is required" }, { status: 400 });
    }

    const raw = await callClaude([
      "You are an expert ATS (Applicant Tracking System) analyst and career coach.",
      "Analyse the CV below and return ONLY valid JSON — no markdown, no commentary.",
      "",
      "Return a JSON object with exactly these keys:",
      '  "overallScore": number 0-100 (ATS compatibility score)',
      '  "categoryScores": {',
      '    "formatting": number 0-100,',
      '    "keywords": number 0-100,',
      '    "structure": number 0-100,',
      '    "readability": number 0-100,',
      '    "impact": number 0-100',
      "  }",
      '  "strengths": string[] (3-5 things the CV does well for ATS)',
      '  "criticalIssues": string[] (up to 5 issues that will cause ATS rejection)',
      '  "improvements": string[] (5-8 specific, actionable improvements)',
      '  "improvedHeadline": string (rewritten professional headline, max 12 words)',
      '  "improvedSummary": string (rewritten 3-4 sentence ATS-optimised summary)',
      "",
      "ATS scoring criteria:",
      "- formatting: No tables, graphics, headers/footers; standard section names; consistent date formats",
      "- keywords: Industry-standard job titles, skills vocabulary, action verbs",
      "- structure: Clear sections (Experience, Education, Skills); reverse chronological order",
      "- readability: Short bullets, quantified achievements, no jargon",
      "- impact: Results-oriented language, metrics, scope of responsibility",
      "",
      `CV to analyse:\n${cvText}`,
    ].join("\n"));

    const parsed = parseJson(raw);

    const data: AtsBaseScoreResult = {
      overallScore: Number(parsed.overallScore ?? 0),
      categoryScores: {
        formatting:  Number((parsed.categoryScores as Record<string, unknown>)?.formatting  ?? 0),
        keywords:    Number((parsed.categoryScores as Record<string, unknown>)?.keywords    ?? 0),
        structure:   Number((parsed.categoryScores as Record<string, unknown>)?.structure   ?? 0),
        readability: Number((parsed.categoryScores as Record<string, unknown>)?.readability ?? 0),
        impact:      Number((parsed.categoryScores as Record<string, unknown>)?.impact      ?? 0),
      },
      strengths:        Array.isArray(parsed.strengths)        ? parsed.strengths as string[]       : [],
      criticalIssues:   Array.isArray(parsed.criticalIssues)   ? parsed.criticalIssues as string[]  : [],
      improvements:     Array.isArray(parsed.improvements)     ? parsed.improvements as string[]    : [],
      improvedHeadline: String(parsed.improvedHeadline ?? ""),
      improvedSummary:  String(parsed.improvedSummary  ?? ""),
      promptVersion:    "ats-base-score-v1",
    };

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ATS scoring failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
