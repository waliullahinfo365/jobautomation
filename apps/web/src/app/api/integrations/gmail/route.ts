import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

/**
 * POST /api/integrations/gmail
 * Body: { action: "connect" | "disconnect" | "test" }
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const body = await req.json();
  // TODO: action === "connect"    → redirect to Google OAuth consent screen
  // TODO: action === "disconnect" → revoke token, clear from IntegrationModel
  // TODO: action === "test"       → GmailService.listLabels() to verify connection
  console.log("POST /api/integrations/gmail", body);
  return NextResponse.json({ success: true, message: "Gmail integration not yet implemented" }, { status: 501 });
}

export async function GET(_req: NextRequest): Promise<NextResponse<ApiResponse>> {
  // TODO: Return current Gmail integration status from IntegrationModel
  return NextResponse.json({ success: true, data: { status: "disconnected" } });
}
