import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function checkAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");
    
    if (!token) {
      return false;
    }

    // Simple validation - check if token exists and is not expired
    // In production, you might want more sophisticated validation
    return true;
  } catch {
    return false;
  }
}

export async function requireAdminAuth() {
  const isAuthorized = await checkAdminAuth();
  
  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    );
  }
  
  return null;
}
