import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface AdminSession {
  username: string;
  expiresAt: number;
}

/**
 * Verify admin credentials against environment variables
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error("[Admin Auth] ADMIN_USERNAME or ADMIN_PASSWORD not configured");
    return false;
  }

  return username === adminUsername && password === adminPassword;
}

/**
 * Create admin session cookie
 */
export async function createAdminSession(username: string): Promise<void> {
  const session: AdminSession = {
    username,
    expiresAt: Date.now() + SESSION_DURATION,
  };

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });
}

/**
 * Get current admin session
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

    if (!sessionCookie?.value) {
      return null;
    }

    const session: AdminSession = JSON.parse(sessionCookie.value);

    // Check if session expired
    if (session.expiresAt < Date.now()) {
      await clearAdminSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("[Admin Auth] Error reading session:", error);
    return null;
  }
}

/**
 * Clear admin session cookie
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

/**
 * Check if user is admin (for API routes)
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized - Admin access required" },
      { status: 401 }
    );
  }

  return null;
}
