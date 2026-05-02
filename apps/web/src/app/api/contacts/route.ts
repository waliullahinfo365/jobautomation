import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { contactSchema } from "@/schemas/contact.schema";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { Contact } from "@/types/contact";

export async function GET(_req: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<Contact>>>> {
  try {
    await connectDB();
    // TODO: const contacts = await ContactModel.find({}).lean();
    return NextResponse.json({
      success: true,
      data: { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0, hasNext: false, hasPrev: false },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Contact>>> {
  try {
    await connectDB();
    const body   = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.message }, { status: 400 });
    }
    // TODO: ContactModel.create(parsed.data)
    return NextResponse.json({ success: true, message: "Not implemented" }, { status: 501 });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
