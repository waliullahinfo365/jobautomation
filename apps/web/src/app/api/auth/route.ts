import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import type { ApiResponse } from "@/types/api";

/**
 * POST /api/auth
 * Handles user registration.
 * Sign-in is handled by NextAuth at /api/auth/[...nextauth].
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB();
    const body = await req.json();

    // TODO: Validate with Zod register schema
    // TODO: Check if email already exists
    // TODO: Hash password with bcrypt
    // TODO: Create UserModel document
    // TODO: Return sanitized user (no passwordHash)


    return NextResponse.json({ success: true, message: "Registration not yet implemented" }, { status: 501 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
