import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

/**
 * POST /api/integrations/ai
 * Body: { action: "test" | "complete", provider: "anthropic", prompt?: string }
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const body = await req.json();
  // TODO: action === "test"     → AIService.complete("Say hello") to verify API key
  // TODO: action === "complete" → AIService.complete(body.prompt, body.options)
  return NextResponse.json({ success: true, message: "AI integration not yet implemented" }, { status: 501 });
}

export async function GET(): Promise<NextResponse<ApiResponse>> {
  return NextResponse.json({ success: true, data: { anthropic: "disconnected" } });
}
