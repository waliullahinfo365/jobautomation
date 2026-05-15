import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const body = await req.json();
  // TODO: action === "test" → CalendarService.listEvents(today, +7 days)
  return NextResponse.json({ success: true, message: "Calendar integration not yet implemented" }, { status: 501 });
}

export async function GET(): Promise<NextResponse<ApiResponse>> {
  return NextResponse.json({ success: true, data: { status: "disconnected" } });
}
