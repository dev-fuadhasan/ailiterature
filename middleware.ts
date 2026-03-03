import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Admin route protection - check before Supabase
  if (url.pathname.startsWith("/admin")) {
    const adminToken = request.cookies.get("admin_token");
    
    if (!adminToken) {
      url.pathname = "/secretlogin";
      return NextResponse.redirect(url);
    }
    // Admin is authenticated, allow through
    return NextResponse.next();
  }
  
  // Existing Supabase session management for regular routes
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
