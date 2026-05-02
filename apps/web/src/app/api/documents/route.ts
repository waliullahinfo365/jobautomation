import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { documentSchema } from "@/schemas/document.schema";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Document } from "@/types/document";

export async function GET(_req: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<Document>>>> {
  try {
    await connectDB();
    // TODO: const docs = await DocumentModel.find({}).lean();
    return NextResponse.json({
      success: true,
      data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0, hasNext: false, hasPrev: false },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Document>>> {
  try {
    await connectDB();
    const body   = await req.json();
    const parsed = documentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });
    }
    // TODO: DocumentModel.create → optionally DriveService.uploadFile
    return NextResponse.json({ success: true, message: "Not implemented" }, { status: 501 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
