import { NextResponse } from "next/server";
import { verifyAdminCredentials, createAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    await createAdminSession(username);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Login] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
