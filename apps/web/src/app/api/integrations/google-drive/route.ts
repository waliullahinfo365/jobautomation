import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const body = await req.json();
  // TODO: action === "connect"    → Google OAuth (same token as Gmail)
  // TODO: action === "test"       → DriveService.listFiles(env.google.driveFolderId)
  console.log("POST /api/integrations/google-drive", body);
  return NextResponse.json({ success: true, message: "Drive integration not yet implemented" }, { status: 501 });
}

export async function GET(): Promise<NextResponse<ApiResponse>> {
  return NextResponse.json({ success: true, data: { status: "disconnected" } });
}
